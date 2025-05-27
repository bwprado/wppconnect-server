export enum ClientSessionStatus {
  INITIALIZING = 'INITIALIZING',
  QRCODE = 'QRCODE',
  PHONECODE = 'PHONECODE',
  CONNECTED = 'CONNECTED',
  CLOSED = 'CLOSED',
}

export enum StatusFindValues {
  isLogged = 'isLogged',
  notLogged = 'notLogged',
  browserClose = 'browserClose',
  qrReadSuccess = 'qrReadSuccess',
  qrReadFail = 'qrReadFail',
  qrReadError = 'qrReadError',
  autocloseCalled = 'autocloseCalled',
  desconnectedMobile = 'desconnectedMobile',
  phoneNotConnected = 'phoneNotConnected',
  serverClose = 'serverClose',
  deleteToken = 'deleteToken',
  inChat = 'inChat',
}

export interface ClientSession {
  status: ClientSessionStatus | null;
  session: string;
  qrcode?: string | null;
  urlcode?: string;
  phoneCode?: string;
  phone?: string;
  config?: any;
  _chatWootClient?: any;
  webhook?: any;
}
