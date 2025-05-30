export interface BaseWebhookData {
  event: WebhookEventType;
  session: string;
  status: WebhookStatus;
  chatStatus: WebhookChatStatus;
}

// Status-related webhooks
export interface StatusFindWebhook extends BaseWebhookData {
  event: WebhookEventType.STATUS_FIND;
}

export interface PhoneCodeWebhook extends BaseWebhookData {
  event: WebhookEventType.PHONE_CODE;
  phoneCode: string;
  phone: string;
}

export interface QRCodeWebhook extends BaseWebhookData {
  event: WebhookEventType.QR_CODE;
  qrcode: string;
  urlcode: string;
}

// Session lifecycle webhooks
export interface CloseSessionWebhook extends BaseWebhookData {
  event: WebhookEventType.CLOSE_SESSION;
  message: string;
}

export interface LogoutSessionWebhook extends BaseWebhookData {
  event: WebhookEventType.LOGOUT_SESSION;
  message: string;
}

// Message-related webhooks
export interface MessageWebhook extends BaseWebhookData {
  event:
    | WebhookEventType.ON_MESSAGE
    | WebhookEventType.ON_SELF_MESSAGE
    | WebhookEventType.UNREAD_MESSAGES;
  // Message object with all WhatsApp message properties
  // The actual message structure would depend on the Message type from WPPConnect
  [key: string]: any;
}

export interface LocationWebhook extends BaseWebhookData {
  event: WebhookEventType.LOCATION;
  // Location data structure
  [key: string]: any;
}

export interface AckWebhook extends BaseWebhookData {
  event: WebhookEventType.ON_ACK;
  // Acknowledgment data structure
  [key: string]: any;
}

// Group/Contact-related webhooks
export interface ParticipantsChangedWebhook extends BaseWebhookData {
  event: WebhookEventType.ON_PARTICIPANTS_CHANGED;
  // Participant change event data
  [key: string]: any;
}

export interface PresenceChangedWebhook extends BaseWebhookData {
  event: WebhookEventType.ON_PRESENCE_CHANGED;
  // Presence change event data
  [key: string]: any;
}

// Interaction webhooks
export interface ReactionMessageWebhook extends BaseWebhookData {
  event: WebhookEventType.ON_REACTION_MESSAGE;
  // Message reaction data
  [key: string]: any;
}

export interface RevokedMessageWebhook extends BaseWebhookData {
  event: WebhookEventType.ON_REVOKED_MESSAGE;
  // Revoked message data
  [key: string]: any;
}

export interface PollResponseWebhook extends BaseWebhookData {
  event: WebhookEventType.ON_POLL_RESPONSE;
  // Poll response data
  [key: string]: any;
}

export interface IncomingCallWebhook extends BaseWebhookData {
  event: WebhookEventType.INCOMING_CALL;
  // Incoming call data
  [key: string]: any;
}

export interface LabelUpdatedWebhook extends BaseWebhookData {
  event: WebhookEventType.ON_UPDATE_LABEL;
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

export enum WebhookStatus {
  CONNECTED = 'CONNECTED',
  INITIALIZING = 'INITIALIZING',
  DISCONNECTED = 'DISCONNECTED',
  QRCODE = 'QRCODE',
  PHONECODE = 'PHONECODE',
  CLOSED = 'CLOSED',
}

export enum WebhookChatStatus {
  isLogged = 'isLogged',
  notLogged = 'notLogged',
  browserClose = 'browserClose',
  qrReadSuccess = 'qrReadSuccess',
  qrReadFail = 'qrReadFail',
  qrReadError = 'qrReadError',
  qrAwaitingRead = 'qrAwaitingRead',
  autocloseCalled = 'autocloseCalled',
  desconnectedMobile = 'desconnectedMobile',
  phoneNotConnected = 'phoneNotConnected',
  serverClose = 'serverClose',
  deleteToken = 'deleteToken',
  inChat = 'inChat',
  available = 'available',
  unavailable = 'unavailable',
}
