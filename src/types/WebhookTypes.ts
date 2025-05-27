import { StatusFindValues } from './ClientSession';

// Base webhook structure - all webhooks include these properties
export interface BaseWebhookData {
  event: string;
  session: string;
}

// Status-related webhooks
export interface StatusFindWebhook extends BaseWebhookData {
  event: 'status-find';
  status: StatusFindValues;
}

export interface PhoneCodeWebhook extends BaseWebhookData {
  event: 'phoneCode';
  phoneCode: string;
  phone: string;
}

export interface QRCodeWebhook extends BaseWebhookData {
  event: 'qrcode';
  qrcode: string;
  urlcode: string;
}

// Session lifecycle webhooks
export interface CloseSessionWebhook extends BaseWebhookData {
  event: 'closesession';
  message: string;
  connected: boolean;
}

export interface LogoutSessionWebhook extends BaseWebhookData {
  event: 'logoutsession';
  message: string;
  connected: boolean;
}

// Message-related webhooks
export interface MessageWebhook extends BaseWebhookData {
  event: 'onmessage' | 'onselfmessage' | 'unreadmessages';
  // Message object with all WhatsApp message properties
  // The actual message structure would depend on the Message type from WPPConnect
  [key: string]: any;
}

export interface LocationWebhook extends BaseWebhookData {
  event: 'location';
  // Location data structure
  [key: string]: any;
}

export interface AckWebhook extends BaseWebhookData {
  event: 'onack';
  // Acknowledgment data structure
  [key: string]: any;
}

// Group/Contact-related webhooks
export interface ParticipantsChangedWebhook extends BaseWebhookData {
  event: 'onparticipantschanged';
  // Participant change event data
  [key: string]: any;
}

export interface PresenceChangedWebhook extends BaseWebhookData {
  event: 'onpresencechanged';
  // Presence change event data
  [key: string]: any;
}

// Interaction webhooks
export interface ReactionMessageWebhook extends BaseWebhookData {
  event: 'onreactionmessage';
  // Message reaction data
  [key: string]: any;
}

export interface RevokedMessageWebhook extends BaseWebhookData {
  event: 'onrevokedmessage';
  // Revoked message data
  [key: string]: any;
}

export interface PollResponseWebhook extends BaseWebhookData {
  event: 'onpollresponse';
  // Poll response data
  [key: string]: any;
}

export interface IncomingCallWebhook extends BaseWebhookData {
  event: 'incomingcall';
  // Incoming call data
  [key: string]: any;
}

export interface LabelUpdatedWebhook extends BaseWebhookData {
  event: 'onupdatelabel';
  // Label update data
  [key: string]: any;
}

// Union type for all possible webhook events
export type WebhookData =
  | StatusFindWebhook
  | PhoneCodeWebhook
  | QRCodeWebhook
  | CloseSessionWebhook
  | LogoutSessionWebhook
  | MessageWebhook
  | LocationWebhook
  | AckWebhook
  | ParticipantsChangedWebhook
  | PresenceChangedWebhook
  | ReactionMessageWebhook
  | RevokedMessageWebhook
  | PollResponseWebhook
  | IncomingCallWebhook
  | LabelUpdatedWebhook;

// Webhook event types enum
export enum WebhookEventType {
  STATUS_FIND = 'status-find',
  PHONE_CODE = 'phoneCode',
  QR_CODE = 'qrcode',
  CLOSE_SESSION = 'closesession',
  LOGOUT_SESSION = 'logoutsession',
  ON_MESSAGE = 'onmessage',
  ON_SELF_MESSAGE = 'onselfmessage',
  UNREAD_MESSAGES = 'unreadmessages',
  LOCATION = 'location',
  ON_ACK = 'onack',
  ON_PARTICIPANTS_CHANGED = 'onparticipantschanged',
  ON_PRESENCE_CHANGED = 'onpresencechanged',
  ON_REACTION_MESSAGE = 'onreactionmessage',
  ON_REVOKED_MESSAGE = 'onrevokedmessage',
  ON_POLL_RESPONSE = 'onpollresponse',
  INCOMING_CALL = 'incomingcall',
  ON_UPDATE_LABEL = 'onupdatelabel',
}
