import type {
  WebmailAccount,
  WebmailDraftInput,
  WebmailMailboxId,
  WebmailMailboxStats,
  WebmailMessage,
  WebmailMessageSummary,
  WebmailStoredMailboxId,
} from './shared';

const storedMailboxIds: WebmailStoredMailboxId[] = ['inbox', 'sent', 'drafts'];
const messages: WebmailMessage[] = [];
const accounts: WebmailAccount[] = [];
let seeded = false;
let accountsSeeded = false;
let demoCounter = 0;

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value: string | undefined): string {
  const trimmed = (value || '').replace(/\r\n/g, '\n').trim();
  return trimmed || '(empty message)';
}

function normalizeSubject(value: string | undefined): string {
  const trimmed = (value || '').trim();
  return trimmed || '(no subject)';
}

function normalizeAddress(value: string | undefined): string {
  const candidate = (value || '').trim();
  if (!candidate) {
    return 'unknown@elit.local';
  }

  const match = candidate.match(/<([^>]+)>/);
  return (match ? match[1] : candidate).replace(/^['"]|['"]$/g, '').trim();
}

function splitAddresses(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeAddress(entry)).filter(Boolean);
  }

  const entries = (value || '')
    .split(/[;,]/)
    .map((entry) => normalizeAddress(entry))
    .filter(Boolean);

  return entries.length > 0 ? entries : ['unknown@elit.local'];
}

function createSnippet(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 120) || '(empty message)';
}

function cloneMessage(message: WebmailMessage): WebmailMessage {
  return {
    ...message,
    to: [...message.to],
  };
}

function toSummary(message: WebmailMessage): WebmailMessageSummary {
  return {
    id: message.id,
    mailbox: message.mailbox,
    from: message.from,
    to: [...message.to],
    subject: message.subject,
    snippet: message.snippet,
    receivedAt: message.receivedAt,
    unread: message.unread,
    source: message.source,
  };
}

function sortNewestFirst(left: WebmailMessage, right: WebmailMessage): number {
  return right.receivedAt.localeCompare(left.receivedAt);
}

function createMessage(input: {
  mailbox: WebmailStoredMailboxId;
  from: string;
  to: string | string[];
  subject?: string;
  text?: string;
  unread?: boolean;
  source: WebmailMessage['source'];
  receivedAt?: string;
}): WebmailMessage {
  const text = normalizeText(input.text);

  return {
    id: createId(input.mailbox),
    mailbox: input.mailbox,
    from: normalizeAddress(input.from),
    to: splitAddresses(input.to),
    subject: normalizeSubject(input.subject),
    text,
    snippet: createSnippet(text),
    receivedAt: input.receivedAt || new Date().toISOString(),
    unread: input.unread ?? input.mailbox === 'inbox',
    source: input.source,
  };
}

function ensureSeeded(): void {
  if (seeded) {
    return;
  }

  seeded = true;
  messages.push(
    createMessage({
      mailbox: 'inbox',
      from: 'nora@design.elit.local',
      to: ['alex@elit.local'],
      subject: 'Palette review for the launch screen',
      text: 'I uploaded the warm brass and slate version. Let me know if we keep the serif headline or move to a monospace accent.',
      source: 'seed',
      unread: true,
      receivedAt: '2026-04-16T07:35:00.000Z',
    }),
    createMessage({
      mailbox: 'inbox',
      from: 'ops@infra.elit.local',
      to: ['alex@elit.local'],
      subject: 'SMTP sandbox is listening locally',
      text: 'Point your local mail client to 127.0.0.1:2525. AUTH and STARTTLS are disabled for the example so you can test quickly.',
      source: 'seed',
      unread: true,
      receivedAt: '2026-04-16T08:10:00.000Z',
    }),
    createMessage({
      mailbox: 'sent',
      from: 'alex@elit.local',
      to: ['team@elit.local'],
      subject: 'Webmail demo status',
      text: 'The inbox, preview pane, and compose flow are wired up. Next step is to pipe live SMTP mail into the local store.',
      source: 'seed',
      unread: false,
      receivedAt: '2026-04-16T09:20:00.000Z',
    }),
    createMessage({
      mailbox: 'drafts',
      from: 'alex@elit.local',
      to: ['product@elit.local'],
      subject: 'Draft: mailbox shortcuts',
      text: 'Could we add keyboard shortcuts for reply, archive, and quick switch between Inbox and Sent?',
      source: 'seed',
      unread: false,
      receivedAt: '2026-04-16T06:15:00.000Z',
    })
  );

  messages.sort(sortNewestFirst);
}

function isMailbox(value: string | undefined): value is WebmailStoredMailboxId {
  return storedMailboxIds.includes(value as WebmailStoredMailboxId);
}

export function listMessages(options: { mailbox?: WebmailMailboxId; query?: string } = {}): WebmailMessageSummary[] {
  ensureSeeded();

  let items = [...messages];

  if (options.mailbox && options.mailbox !== 'all' && isMailbox(options.mailbox)) {
    items = items.filter((message) => message.mailbox === options.mailbox);
  }

  const query = (options.query || '').trim().toLowerCase();
  if (query) {
    items = items.filter((message) => {
      return [message.from, message.to.join(' '), message.subject, message.text, message.snippet]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }

  return items.sort(sortNewestFirst).map(toSummary);
}

export function getMailboxStats(): WebmailMailboxStats {
  ensureSeeded();

  return {
    all: messages.length,
    inbox: messages.filter((message) => message.mailbox === 'inbox').length,
    sent: messages.filter((message) => message.mailbox === 'sent').length,
    drafts: messages.filter((message) => message.mailbox === 'drafts').length,
    unread: messages.filter((message) => message.mailbox === 'inbox' && message.unread).length,
  };
}

export function getMessage(id: string): WebmailMessage | null {
  ensureSeeded();
  const message = messages.find((entry) => entry.id === id);

  if (!message) {
    return null;
  }

  if (message.mailbox === 'inbox') {
    message.unread = false;
  }

  return cloneMessage(message);
}

export function createOutgoingMessage(input: WebmailDraftInput): WebmailMessage {
  ensureSeeded();

  if (!input.from.trim()) {
    throw new Error('A sender address is required.');
  }

  if (!input.to.trim()) {
    throw new Error('At least one recipient is required.');
  }

  const message = createMessage({
    mailbox: 'sent',
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    source: 'web',
    unread: false,
  });

  messages.unshift(message);
  return cloneMessage(message);
}

export function saveDraftMessage(input: WebmailDraftInput): WebmailMessage {
  ensureSeeded();

  const message = createMessage({
    mailbox: 'drafts',
    from: input.from || 'alex@elit.local',
    to: input.to || 'unknown@elit.local',
    subject: input.subject,
    text: input.text,
    source: 'web',
    unread: false,
  });

  messages.unshift(message);
  return cloneMessage(message);
}

export function addIncomingMessage(input: {
  from?: string;
  to?: string | string[];
  subject?: string;
  text?: string;
  source?: WebmailMessage['source'];
  receivedAt?: string;
}): WebmailMessage {
  ensureSeeded();

  const message = createMessage({
    mailbox: 'inbox',
    from: input.from || 'mailer-daemon@elit.local',
    to: input.to || ['alex@elit.local'],
    subject: input.subject,
    text: input.text,
    source: input.source || 'smtp',
    unread: true,
    receivedAt: input.receivedAt,
  });

  messages.unshift(message);
  return cloneMessage(message);
}

export function injectDemoInboundMessage(): WebmailMessage {
  demoCounter += 1;

  return addIncomingMessage({
    from: `demo${demoCounter}@mailer.elit.local`,
    to: ['alex@elit.local'],
    subject: `Demo inbound message #${demoCounter}`,
    text: `This message was generated by the Webmail example API so you can exercise the inbox without opening a separate SMTP client.`,
    source: 'demo',
  });
}

function ensureAccountsSeeded(): void {
  if (accountsSeeded) {
    return;
  }

  accountsSeeded = true;
  accounts.push({
    id: createId('acc'),
    email: 'alex@elit.local',
    name: 'Alex',
    createdAt: new Date().toISOString(),
    isDefault: true,
  });
}

export function listAccounts(): WebmailAccount[] {
  ensureAccountsSeeded();
  return accounts.map((account) => ({ ...account }));
}

export function registerAccount(email: string, name: string): WebmailAccount {
  ensureAccountsSeeded();

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Email address is required.');
  }

  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error(`${normalizedEmail} is already registered.`);
  }

  const account: WebmailAccount = {
    id: createId('acc'),
    email: normalizedEmail,
    name: name.trim() || normalizedEmail.split('@')[0],
    createdAt: new Date().toISOString(),
    isDefault: accounts.length === 0,
  };

  accounts.push(account);
  return { ...account };
}