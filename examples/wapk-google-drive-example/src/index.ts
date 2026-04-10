import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 3333);
const appName = process.env.APP_NAME ?? 'Elit Google Drive WAPK Example';

const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`${appName} running from Google Drive on port ${port}\n`);
});

server.listen(port, () => {
    console.log(`${appName} listening on http://127.0.0.1:${port}`);
});