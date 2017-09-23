import { Router } from 'express';
import * as auth from '../auth';

const router = Router();

router.get('/domains', auth.findClient, async (req, res) => {
  const domains = await req.client.getDomains();
  res.send(domains);
});

router.get('/domains/:domainId/talks', auth.findClient, async (req, res) => {
  const talks = await req.client.getTalks(req.params.domainId);
  res.send(talks);
});

router.get('/domains/:domainId/talks/:talkId/messages', (req, res) => {
  console.log(req.method, req.path);  // TODO
  res.send('');
});

router.post('/domains/:domainId/talks/:talkId/messages', auth.findClient, async (req, res) => {
  const q = req.params;
  const result = await req.client.sendTextMessage(q.domainId, q.talkId, req.body)
    .then((res: string) => ({status: 200, body: res}))
    .catch((err: string) => {
      if (err === 'NotFound') {
        return {status: 404, body: ''};
      } else {
        return {status: 500, body: ''};
      }
    });
  res.status(result.status).send(result.body);
});

export default router;