import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { createServer as createNetServer } from 'node:net';

import type { PmProxyConfig } from '../../shares/config';

export interface PmProxyController {
    setTarget(targetUrl: string | undefined): void;
    close(): Promise<void>;
}

export function resolvePmProxyHost(proxy: PmProxyConfig): string {
    return proxy.host?.trim() || '0.0.0.0';
}

export function resolvePmProxyTargetHost(proxy: PmProxyConfig): string {
    return proxy.targetHost?.trim() || '127.0.0.1';
}

export function resolvePmProxyEnvVar(proxy: PmProxyConfig): string {
    return proxy.envVar?.trim() || 'PORT';
}

export function buildPmProxyTargetUrl(proxy: PmProxyConfig, targetPort: number): string {
    return `http://${resolvePmProxyTargetHost(proxy)}:${targetPort}`;
}

export function rewritePmProxyHealthCheckUrl(url: string, targetHost: string, targetPort: number): string {
    const targetUrl = new URL(url);
    targetUrl.hostname = targetHost;
    targetUrl.port = String(targetPort);
    return targetUrl.toString();
}

export async function allocatePmProxyTargetPort(host = '127.0.0.1'): Promise<number> {
    const server = createNetServer();

    return await new Promise<number>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, host, () => {
            const address = server.address();
            if (!address || typeof address === 'string') {
                server.close(() => reject(new Error('Failed to allocate an internal PM proxy port.')));
                return;
            }

            const port = address.port;
            server.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(port);
            });
        });
    });
}

export async function createPmProxyController(proxy: PmProxyConfig): Promise<PmProxyController> {
    let target: URL | null = null;
    const server = createServer((req, res) => {
        if (!target) {
            res.statusCode = 503;
            res.end('PM proxy target is not ready.');
            return;
        }

        const requestLib = target.protocol === 'https:' ? httpsRequest : httpRequest;
        const targetUrl = new URL(req.url || '/', target);
        const headers: Record<string, string | number | string[]> = {};
        for (const [key, value] of Object.entries(req.headers)) {
            if (value !== undefined) {
                headers[key] = value;
            }
        }
        headers.host = target.host;

        const proxyReq = requestLib(targetUrl, {
            method: req.method,
            headers,
        }, (proxyRes) => {
            const outgoingHeaders: Record<string, string | number | string[]> = {};
            for (const [key, value] of Object.entries(proxyRes.headers)) {
                if (value !== undefined) {
                    outgoingHeaders[key] = value;
                }
            }

            res.writeHead(proxyRes.statusCode || 200, outgoingHeaders);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (error) => {
            if (!res.headersSent) {
                res.statusCode = 502;
            }
            res.end(`PM proxy error: ${error.message}`);
        });

        req.pipe(proxyReq);
    });

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(proxy.port, resolvePmProxyHost(proxy), () => resolve());
    });

    return {
        setTarget(targetUrl: string | undefined) {
            target = targetUrl ? new URL(targetUrl) : null;
        },
        close() {
            return new Promise<void>((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });
        },
    };
}