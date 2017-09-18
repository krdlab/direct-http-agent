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

router.delete('/:id', (req, res) => {
  console.log(req.method, req.path);
  res.send('');
});

module.exports = router;