import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { createServer as createNetServer } from 'node:net';
import type { Duplex } from 'node:stream';

import type { PmProxyConfig } from '../../shares/config';

export interface PmProxyController {
    setTarget(targetUrl: string | undefined): void;
    setTargets(targetUrls: string[]): void;
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

function buildPmProxyHeaders(headersInput: Record<string, string | string[] | undefined>, host: string): Record<string, string | string[]> {
    const headers: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(headersInput)) {
        if (value !== undefined) {
            headers[key] = value;
        }
    }
    headers.host = host;
    return headers;
}

function writeRawHttpResponse(socket: Duplex, statusCode: number, statusMessage: string, headers: Record<string, string | string[] | number | undefined>): void {
    const lines = [`HTTP/1.1 ${statusCode} ${statusMessage}`];
    for (const [key, value] of Object.entries(headers)) {
        if (value === undefined) {
            continue;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                lines.push(`${key}: ${item}`);
            }
            continue;
        }

        lines.push(`${key}: ${value}`);
    }
    socket.write(`${lines.join('\r\n')}\r\n\r\n`);
}

export async function createPmProxyController(proxy: PmProxyConfig): Promise<PmProxyController> {
    let targets: URL[] = [];
    let nextTargetIndex = 0;

    const setResolvedTargets = (nextTargets: URL[]): void => {
        const unchanged = nextTargets.length === targets.length
            && nextTargets.every((target, index) => targets[index]?.href === target.href);

        targets = nextTargets;
        if (targets.length === 0) {
            nextTargetIndex = 0;
            return;
        }

        if (!unchanged) {
            nextTargetIndex = nextTargetIndex % targets.length;
        }
    };

    const pickTarget = (): URL | null => {
        if (targets.length === 0) {
            return null;
        }

        const target = targets[nextTargetIndex % targets.length];
        nextTargetIndex = (nextTargetIndex + 1) % targets.length;
        return target;
    };

    const server = createServer((req, res) => {
        const target = pickTarget();
        if (!target) {
            res.statusCode = 503;
            res.end('PM proxy target is not ready.');
            return;
        }

        const requestLib = target.protocol === 'https:' ? httpsRequest : httpRequest;
        const targetUrl = new URL(req.url || '/', target);
        const headers = buildPmProxyHeaders(req.headers, target.host);

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

    server.on('upgrade', (req, socket, head) => {
        const target = pickTarget();
        if (!target) {
            writeRawHttpResponse(socket, 503, 'Service Unavailable', {
                connection: 'close',
                'content-length': 0,
            });
            socket.destroy();
            return;
        }

        const requestLib = target.protocol === 'https:' ? httpsRequest : httpRequest;
        const targetUrl = new URL(req.url || '/', target);
        const proxyReq = requestLib(targetUrl, {
            method: req.method,
            headers: buildPmProxyHeaders(req.headers, target.host),
        });

        proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
            writeRawHttpResponse(socket, proxyRes.statusCode || 101, proxyRes.statusMessage || 'Switching Protocols', proxyRes.headers);
            if (head.length > 0) {
                proxySocket.write(head);
            }
            if (proxyHead.length > 0) {
                socket.write(proxyHead);
            }

            socket.on('error', () => proxySocket.destroy());
            proxySocket.on('error', () => socket.destroy());
            proxySocket.pipe(socket);
            socket.pipe(proxySocket);
        });

        proxyReq.on('response', (proxyRes) => {
            writeRawHttpResponse(socket, proxyRes.statusCode || 502, proxyRes.statusMessage || 'Bad Gateway', proxyRes.headers);
            proxyRes.pipe(socket);
        });

        proxyReq.on('error', (error) => {
            writeRawHttpResponse(socket, 502, 'Bad Gateway', {
                connection: 'close',
                'content-type': 'text/plain; charset=utf-8',
                'content-length': Buffer.byteLength(`PM proxy error: ${error.message}`),
            });
            socket.end(`PM proxy error: ${error.message}`);
        });

        proxyReq.end();
    });

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(proxy.port, resolvePmProxyHost(proxy), () => resolve());
    });

    return {
        setTarget(targetUrl: string | undefined) {
            setResolvedTargets(targetUrl ? [new URL(targetUrl)] : []);
        },
        setTargets(targetUrls: string[]) {
            setResolvedTargets(targetUrls.map((targetUrl) => new URL(targetUrl)));
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