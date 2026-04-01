/**
 * Simple HTTP server that works across node/bun/deno
 * Tests WAPK live-sync: writes logs and responds to requests
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import url from 'node:url';

const PORT = parseInt(process.env.PORT || '3333', 10);
const LOG_FILE = 'wapk-runtime.log';

// Write startup log
function writeLog(message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(LOG_FILE, logEntry);
        console.log(logEntry.trim());
    } catch (err) {
        console.error('Log write error:', err);
    }
}

// Simple request counter for tracking
let requestCount = 0;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url || '/', true);
    const pathname = parsedUrl.pathname || '/';
    requestCount++;

    // Log request
    writeLog(`Request #${requestCount}: ${req.method} ${pathname}`);

    res.setHeader('Content-Type', 'text/plain');

    // Health check
    if (pathname === '/') {
        res.statusCode = 200;
        res.end(`WAPK Example Server Active\nRequests: ${requestCount}`);
        return;
    }

    // Status endpoint
    if (pathname === '/status') {
        const uptime = process.uptime();
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
            name: '@elit/wapk-example',
            version: '1.0.0',
            runtime: 'node',
            port: PORT,
            requestCount,
            uptime: Math.round(uptime),
            timestamp: new Date().toISOString(),
        }, null, 2));
        return;
    }

    // Write marker files for live-sync testing
    if (pathname === '/create-marker') {
        const markerPath = `marker-${requestCount}.txt`;
        fs.writeFileSync(markerPath, `Marker file created at request ${requestCount}`);
        writeLog(`Created marker file: ${markerPath}`);
        res.statusCode = 200;
        res.end(`Marker file created: ${markerPath}`);
        return;
    }

    // Shutdown gracefully
    if (pathname === '/shutdown') {
        writeLog('Shutdown requested');
        res.statusCode = 200;
        res.end('Shutting down...');
        setTimeout(() => process.exit(0), 100);
        return;
    }

    // 404
    res.statusCode = 404;
    res.end('Not found');
});

server.listen(PORT, () => {
    writeLog(`Server running on http://localhost:${PORT}`);
    writeLog('Endpoints: GET / (health), GET /status (info), GET /create-marker (test), GET /shutdown (exit)');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    writeLog('SIGINT received, shutting down');
    process.exit(0);
});

process.on('SIGTERM', () => {
    writeLog('SIGTERM received, shutting down');
    process.exit(0);
});
