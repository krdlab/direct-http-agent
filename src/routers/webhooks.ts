// path: /webhooks
import { Router } from 'express';
import * as models from '../models';

const router = Router();

router.post('/', async (req, res) => {
  const result = await models.addWebhook(req.user, req.body);
  res.send(result);
});

router.get('/', async (req, res) => {
  const result = await models.getWebhooks(req.user);
  res.send(result);
});

router.delete('/:id', async (req, res) => {
  const result = await models.deleteWebhook(req.user, req.params.id);
  res.send(result);
});

export default router;