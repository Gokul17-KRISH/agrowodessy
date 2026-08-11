import { app, initServerApp } from '../server.js';

export default async function handler(req: any, res: any) {
  await initServerApp();
  return app(req, res);
}
