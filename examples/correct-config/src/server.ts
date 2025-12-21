
import { ServerRouter } from 'elit/server'

export const router = new ServerRouter();



router.get('/api/hello', async (ctx) => {
    ctx.res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    ctx.res.end("Hello from Elit ServerRouter!");
});

export const server = router