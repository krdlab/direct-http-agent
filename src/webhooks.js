// path: /webhooks
const router = require('express').Router();
const model = require('./model');

router.post('/', async (req, res) => {
  const result = await model.addWebhook(req.user, req.body);
  res.send(result);
});

router.get('/', async (req, res) => {
  const result = await model.getWebhooks(req.user);
  res.send(result);
});

router.delete('/:id', async (req, res) => {
  const result = await model.deleteWebhook(req.user, req.params.id);
  res.send(result);
});

module.exports = router;