/*
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { create, SocketState } from '@wppconnect-team/wppconnect';
import { Request } from 'express';

import { download } from '../controller/sessionController';
import { WhatsAppServer } from '../types/WhatsAppServer';
import chatWootClient from './chatWootClient';
import { autoDownload, callWebHook, startHelper } from './functions';
import { clientsArray, eventEmitter } from './sessionUtil';
import Factory from './tokenStore/factory';
import {
  WebhookChatStatus,
  WebhookEventType,
  WebhookStatus,
} from '../types/WebhookTypes';

export default class CreateSessionUtil {
  startChatWootClient(client: any) {
    if (client.config.chatWoot && !client._chatWootClient)
      client._chatWootClient = new chatWootClient(
        client.config.chatWoot,
        client.session
      );
    return client._chatWootClient;
  }

  async createSessionUtil(
    req: any,
    clientsArray: any,
    session: string,
    res?: any
  ) {
    try {
      let client = this.getClient(session) as any;
      if (client.status != null && client.status !== 'CLOSED') return;
      client.status = 'INITIALIZING';
      client.config = req.body;

      const tokenStore = new Factory();
      const myTokenStore = tokenStore.createTokenStory(client);
      const tokenData = await myTokenStore.getToken(session);

      // we need this to update phone in config every time session starts, so we can ask for code for it again.
      myTokenStore.setToken(session, tokenData ?? {});

      this.startChatWootClient(client);

      if (req.serverOptions.customUserDataDir) {
        req.serverOptions.createOptions.puppeteerOptions = {
          userDataDir: req.serverOptions.customUserDataDir + session,
        };
      }

      const wppClient = await create(
        Object.assign(
          {},
          { tokenStore: myTokenStore },
          req.serverOptions.createOptions,
          {
            session: session,
            phoneNumber: client.config.phone ?? null,
            deviceName:
              client.config.phone == undefined // bug when using phone code this shouldn't be passed (https://github.com/wppconnect-team/wppconnect-server/issues/1687#issuecomment-2099357874)
                ? client.config?.deviceName ||
                  req.serverOptions.deviceName ||
                  'WppConnect'
                : undefined,
            poweredBy:
              client.config.phone == undefined // bug when using phone code this shouldn't be passed (https://github.com/wppconnect-team/wppconnect-server/issues/1687#issuecomment-2099357874)
                ? client.config?.poweredBy ||
                  req.serverOptions.poweredBy ||
                  'WPPConnect-Server'
                : undefined,
            catchLinkCode: (code: string) => {
              this.exportPhoneCode(req, client.config.phone, code, client, res);
            },
            catchQR: (
              base64Qr: any,
              asciiQR: any,
              attempt: any,
              urlCode: string
            ) => {
              this.exportQR(req, base64Qr, urlCode, client, res);
            },
            onLoadingScreen: (percent: string, message: string) => {
              req.logger.info(`[${session}] ${percent}% - ${message}`);
            },
            statusFind: (statusFind: string) => {
              const StatusFindMapper = {
                autocloseCalled: WebhookStatus.CLOSED,
                desconnectedMobile: WebhookStatus.DISCONNECTED,
                isLogged: WebhookStatus.CONNECTED,
                notLogged: WebhookStatus.DISCONNECTED,
                browserClose: WebhookStatus.CLOSED,
                qrReadSuccess: WebhookStatus.CONNECTED,
                qrReadFail: WebhookStatus.DISCONNECTED,
                qrReadError: WebhookStatus.DISCONNECTED,
                qrAwaitingRead: WebhookStatus.QRCODE,
                inChat: WebhookStatus.CONNECTED,
                unavailable: WebhookStatus.DISCONNECTED,
                available: WebhookStatus.CONNECTED,
                deleteToken: WebhookStatus.DISCONNECTED,
                serverClose: WebhookStatus.DISCONNECTED,
                phoneNotConnected: WebhookStatus.DISCONNECTED,
              };
              try {
                eventEmitter.emit(
                  `status-${client.session}`,
                  client,
                  statusFind
                );
                if (
                  statusFind === 'autocloseCalled' ||
                  statusFind === 'desconnectedMobile'
                ) {
                  client.status = 'CLOSED';
                  client.qrcode = null;
                  client.close();
                  clientsArray[session] = undefined;
                }
                callWebHook(client, req, WebhookEventType.STATUS_FIND, {
                  event: WebhookEventType.STATUS_FIND,
                  status: StatusFindMapper[statusFind],
                  session: client.session,
                  chatStatus: statusFind,
                });
                req.logger.info(statusFind + '\n\n');
              } catch (error) {}
            },
          }
        )
      );

      client = clientsArray[session] = Object.assign(wppClient, client);
      await this.start(req, client);

      if (req.serverOptions.webhook.onParticipantsChanged) {
        await this.onParticipantsChanged(req, client);
      }

      if (req.serverOptions.webhook.onReactionMessage) {
        await this.onReactionMessage(client, req);
      }

      if (req.serverOptions.webhook.onRevokedMessage) {
        await this.onRevokedMessage(client, req);
      }

      if (req.serverOptions.webhook.onPollResponse) {
        await this.onPollResponse(client, req);
      }
      if (req.serverOptions.webhook.onLabelUpdated) {
        await this.onLabelUpdated(client, req);
      }
    } catch (e) {
      req.logger.error(e);
      if (e instanceof Error && e.name == 'TimeoutError') {
        const client = this.getClient(session) as any;
        client.status = 'CLOSED';
      }
    }
  }

  async opendata(req: Request, session: string, res?: any) {
    await this.createSessionUtil(req, clientsArray, session, res);
  }

  exportPhoneCode(
    req: any,
    phone: any,
    phoneCode: any,
    client: WhatsAppServer,
    res?: any
  ) {
    eventEmitter.emit(`phoneCode-${client.session}`, phoneCode, client);

    Object.assign(client, {
      status: 'PHONECODE',
      phoneCode: phoneCode,
      phone: phone,
    });

    req.io.emit('phoneCode', {
      data: phoneCode,
      phone: phone,
      session: client.session,
    });

    callWebHook(client, req, WebhookEventType.PHONE_CODE, {
      event: WebhookEventType.PHONE_CODE,
      phoneCode: phoneCode,
      phone: phone,
      session: client.session,
      chatStatus: WebhookChatStatus.notLogged,
    });

    if (res && !res._headerSent)
      res.status(200).json({
        event: WebhookEventType.PHONE_CODE,
        phoneCode: phoneCode,
        phone: phone,
        session: client.session,
        chatStatus: WebhookChatStatus.notLogged,
      });
  }

  exportQR(
    req: any,
    qrCode: any,
    urlCode: any,
    client: WhatsAppServer,
    res?: any
  ) {
    eventEmitter.emit(`qrcode-${client.session}`, qrCode, urlCode, client);
    Object.assign(client, {
      status: 'QRCODE',
      qrcode: qrCode,
      urlcode: urlCode,
    });

    qrCode = qrCode.replace('data:image/png;base64,', '');
    const imageBuffer = Buffer.from(qrCode, 'base64');

    req.io.emit('qrCode', {
      data: 'data:image/png;base64,' + imageBuffer.toString('base64'),
      session: client.session,
    });

    callWebHook(client, req, WebhookEventType.QR_CODE, {
      event: WebhookEventType.QR_CODE,
      qrcode: qrCode,
      urlcode: urlCode,
      session: client.session,
      status: WebhookStatus.QRCODE,
      chatStatus: WebhookChatStatus.qrAwaitingRead,
    });
    if (res && !res._headerSent)
      return res.status(200).json({
        event: WebhookEventType.QR_CODE,
        qrcode: qrCode,
        urlcode: urlCode,
        session: client.session,
        status: WebhookStatus.QRCODE,
        chatStatus: WebhookChatStatus.qrAwaitingRead,
      });
  }

  async onParticipantsChanged(req: any, client: any) {
    await client.isConnected();
    await client.onParticipantsChanged((message: any) => {
      callWebHook(client, req, WebhookEventType.ON_PARTICIPANTS_CHANGED, {
        ...message,
        session: client.session,
        status: WebhookStatus.CONNECTED,
        event: WebhookEventType.ON_PARTICIPANTS_CHANGED,
        chatStatus: WebhookChatStatus.qrAwaitingRead,
      });
    });
  }

  async start(req: Request, client: WhatsAppServer) {
    try {
      await client.isConnected();
      Object.assign(client, { status: 'CONNECTED', qrcode: null });

      req.logger.info(`Started Session: ${client.session}`);
      req.io.emit('session-logged', { status: true, session: client.session });
      startHelper(client, req);
    } catch (error) {
      req.logger.error(error);
      req.io.emit('session-error', client.session);
    }

    await this.checkStateSession(client, req);
    await this.listenMessages(client, req);

    if (req.serverOptions.webhook.listenAcks) {
      await this.listenAcks(client, req);
    }

    if (req.serverOptions.webhook.onPresenceChanged) {
      await this.onPresenceChanged(client, req);
    }
  }

  async checkStateSession(client: WhatsAppServer, req: Request) {
    await client.onStateChange((state) => {
      req.logger.info(`State Change ${state}: ${client.session}`);
      const conflits = [SocketState.CONFLICT];

      if (conflits.includes(state)) {
        client.useHere();
      }
    });
  }

  async listenMessages(client: WhatsAppServer, req: Request) {
    client.onMessage(async (message: any) => {
      eventEmitter.emit(`mensagem-${client.session}`, client, message);
      callWebHook(client, req, WebhookEventType.ON_MESSAGE, message);
      if (message.type === 'location')
        client.onLiveLocation(message.sender.id, (location) => {
          callWebHook(client, req, WebhookEventType.LOCATION, {
            ...location,
            session: client.session,
            event: WebhookEventType.LOCATION,
            status: WebhookStatus.CONNECTED,
            chatStatus: WebhookChatStatus.inChat,
          });
        });
    });

    client.onAnyMessage(async (message: any) => {
      message.session = client.session;

      if (message.type === 'sticker') {
        download(message, client, req.logger);
      }

      if (
        req.serverOptions?.websocket?.autoDownload ||
        (req.serverOptions?.webhook?.autoDownload && message.fromMe == false)
      ) {
        await autoDownload(client, req, message);
      }

      req.io.emit('received-message', { response: message });
      if (req.serverOptions.webhook.onSelfMessage && message.fromMe)
        callWebHook(client, req, WebhookEventType.ON_SELF_MESSAGE, {
          ...message,
          session: client.session,
          event: WebhookEventType.ON_SELF_MESSAGE,
          status: WebhookStatus.CONNECTED,
          chatStatus: WebhookChatStatus.inChat,
        });
    });

    client.onIncomingCall(async (call) => {
      req.io.emit('incomingcall', call);
      callWebHook(client, req, WebhookEventType.INCOMING_CALL, {
        ...call,
        session: client.session,
        event: WebhookEventType.INCOMING_CALL,
        status: WebhookStatus.CONNECTED,
        chatStatus: WebhookChatStatus.inChat,
      });
    });
  }

  async listenAcks(client: WhatsAppServer, req: Request) {
    client.onAck(async (ack) => {
      req.io.emit('onack', ack);
      callWebHook(client, req, WebhookEventType.ON_ACK, {
        ...ack,
        session: client.session,
        event: WebhookEventType.ON_ACK,
        status: WebhookStatus.CONNECTED,
        chatStatus: WebhookChatStatus.inChat,
      });
    });
  }

  async onPresenceChanged(client: WhatsAppServer, req: Request) {
    client.onPresenceChanged(async (presenceChangedEvent) => {
      req.io.emit('onpresencechanged', presenceChangedEvent);
      callWebHook(client, req, WebhookEventType.ON_PRESENCE_CHANGED, {
        ...presenceChangedEvent,
        session: client.session,
        event: WebhookEventType.ON_PRESENCE_CHANGED,
        status: WebhookStatus.CONNECTED,
        chatStatus: WebhookChatStatus.inChat,
      });
    });
  }

  async onReactionMessage(client: WhatsAppServer, req: Request) {
    await client.isConnected();
    await client.onReactionMessage(async (reaction: any) => {
      req.io.emit('onreactionmessage', reaction);
      callWebHook(client, req, WebhookEventType.ON_REACTION_MESSAGE, {
        ...reaction,
        session: client.session,
        event: WebhookEventType.ON_REACTION_MESSAGE,
        status: WebhookStatus.CONNECTED,
        chatStatus: WebhookChatStatus.inChat,
      });
    });
  }

  async onRevokedMessage(client: WhatsAppServer, req: Request) {
    await client.isConnected();
    client.onRevokedMessage(async (response: any) => {
      req.io.emit('onrevokedmessage', response);
      callWebHook(client, req, WebhookEventType.ON_REVOKED_MESSAGE, {
        ...response,
        session: client.session,
        event: WebhookEventType.ON_REVOKED_MESSAGE,
        status: WebhookStatus.CONNECTED,
        chatStatus: WebhookChatStatus.inChat,
      });
    });
  }
  async onPollResponse(client: WhatsAppServer, req: Request) {
    await client.isConnected();
    client.onPollResponse(async (response: any) => {
      req.io.emit('onpollresponse', response);
      callWebHook(client, req, WebhookEventType.ON_POLL_RESPONSE, {
        ...response,
        session: client.session,
        event: WebhookEventType.ON_POLL_RESPONSE,
        status: WebhookStatus.CONNECTED,
        chatStatus: WebhookChatStatus.inChat,
      });
    });
  }
  async onLabelUpdated(client: WhatsAppServer, req: Request) {
    await client.isConnected();
    client.onUpdateLabel(async (response: any) => {
      req.io.emit('onupdatelabel', response);
      callWebHook(client, req, WebhookEventType.ON_UPDATE_LABEL, {
        ...response,
        session: client.session,
        event: WebhookEventType.ON_UPDATE_LABEL,
        status: WebhookStatus.CONNECTED,
        chatStatus: WebhookChatStatus.inChat,
      });
    });
  }

  encodeFunction(data: any, webhook: any) {
    data.webhook = webhook;
    return JSON.stringify(data);
  }

  decodeFunction(text: any, client: any) {
    const object = JSON.parse(text);
    if (object.webhook && !client.webhook) client.webhook = object.webhook;
    delete object.webhook;
    return object;
  }

  getClient(session: any) {
    let client = clientsArray[session];

    if (!client)
      client = clientsArray[session] = {
        status: null,
        session: session,
      } as any;
    return client;
  }
}
