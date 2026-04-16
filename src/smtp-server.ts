/**
 * SMTP server helpers built on top of the smtp-server package.
 */

import type { AddressInfo, Server as NetServer } from 'net';

import { SMTPServer } from 'smtp-server';
import type { SMTPServerOptions } from 'smtp-server';

export type {
  SMTPServerAddress,
  SMTPServerAuthentication,
  SMTPServerAuthenticationResponse,
  SMTPServerDataStream,
  SMTPServerEnvelope,
  SMTPServerOptions,
  SMTPServerSession,
} from 'smtp-server';

export const DEFAULT_SMTP_PORT = 2525;
export const DEFAULT_SMTP_HOST = '127.0.0.1';

export interface ElitSMTPServerConfig extends SMTPServerOptions {
  port?: number;
  host?: string;
  label?: string;
}

export type ElitSMTPServerInput = ElitSMTPServerConfig | ElitSMTPServerConfig[] | undefined;

export interface ResolvedElitSMTPServerConfig extends SMTPServerOptions {
  port: number;
  host: string;
  label?: string;
}

export interface ElitSMTPServerHandle {
  server: SMTPServer;
  config: ResolvedElitSMTPServerConfig;
  listen(callback?: () => void): NetServer;
  address(): AddressInfo | string | null;
  close(): Promise<void>;
}

export function resolveSmtpServerConfig(config: ElitSMTPServerConfig = {}): ResolvedElitSMTPServerConfig {
  const { port = DEFAULT_SMTP_PORT, host = DEFAULT_SMTP_HOST, label, ...serverOptions } = config;

  return {
    ...serverOptions,
    port,
    host,
    label,
  };
}

export function normalizeSmtpServerConfigs(input: ElitSMTPServerInput): ResolvedElitSMTPServerConfig[] {
  const configs = Array.isArray(input)
    ? input
    : input
      ? [input]
      : [];

  return configs.map((config) => resolveSmtpServerConfig(config));
}

function closeSmtpServer(server: SMTPServer): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;

      if (error) {
        reject(error);
        return;
      }

      resolve();
    };

    const handleCloseError = (error: Error) => {
      const errorCode = (error as NodeJS.ErrnoException).code;

      if (errorCode === 'ERR_SERVER_NOT_RUNNING') {
        finish();
        return;
      }

      finish(error);
    };

    try {
      server.close(() => finish());
    } catch (error) {
      handleCloseError(error as Error);
    }
  });
}

export function createSmtpServer(config: ElitSMTPServerConfig = {}): ElitSMTPServerHandle {
  const resolvedConfig = resolveSmtpServerConfig(config);
  const { port, host, label: _label, ...serverOptions } = resolvedConfig;
  const server = new SMTPServer(serverOptions);

  return {
    server,
    config: resolvedConfig,
    listen(callback?: () => void): NetServer {
      return callback
        ? server.listen(port, host, callback)
        : server.listen(port, host);
    },
    address(): AddressInfo | string | null {
      return server.server.address() as AddressInfo | string | null;
    },
    close(): Promise<void> {
      return closeSmtpServer(server);
    },
  };
}

export function startSmtpServer(config: ElitSMTPServerConfig = {}): ElitSMTPServerHandle {
  const handle = createSmtpServer(config);
  handle.listen();
  return handle;
}

export default {
  SMTPServer,
  createSmtpServer,
  startSmtpServer,
  DEFAULT_SMTP_HOST,
  DEFAULT_SMTP_PORT,
};