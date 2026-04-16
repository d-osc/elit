export type WebmailMailboxId = 'all' | 'inbox' | 'sent' | 'drafts';
export type WebmailStoredMailboxId = Exclude<WebmailMailboxId, 'all'>;
export type WebmailMailSource = 'seed' | 'smtp' | 'web' | 'demo';

export interface WebmailDraftInput {
  from: string;
  to: string;
  subject: string;
  text: string;
}

export interface WebmailMessage {
  id: string;
  mailbox: WebmailStoredMailboxId;
  from: string;
  to: string[];
  subject: string;
  text: string;
  snippet: string;
  receivedAt: string;
  unread: boolean;
  source: WebmailMailSource;
}

export interface WebmailMessageSummary {
  id: string;
  mailbox: WebmailStoredMailboxId;
  from: string;
  to: string[];
  subject: string;
  snippet: string;
  receivedAt: string;
  unread: boolean;
  source: WebmailMailSource;
}

export interface WebmailMailboxStats {
  all: number;
  inbox: number;
  sent: number;
  drafts: number;
  unread: number;
}

export interface WebmailMessagesResponse {
  items: WebmailMessageSummary[];
  stats: WebmailMailboxStats;
}

export interface WebmailMessageResponse {
  message: WebmailMessage;
  stats: WebmailMailboxStats;
}

export interface WebmailStatusResponse {
  ok: true;
  smtp: {
    host: string;
    port: number;
    banner: string;
  };
  stats: WebmailMailboxStats;
}

export interface WebmailAccount {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isDefault: boolean;
}

export interface WebmailAccountsResponse {
  accounts: WebmailAccount[];
}

export interface WebmailAccountRegisterResponse {
  account: WebmailAccount;
  accounts: WebmailAccount[];
}

export const WEBMAIL_SMTP_HOST = '127.0.0.1';
export const WEBMAIL_SMTP_PORT = 2525;
export const WEBMAIL_SMTP_BANNER = 'Elit Webmail SMTP Sandbox';