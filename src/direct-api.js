const router = require('express').Router();
const model  = require('./model');

router.get('/domains', async (req, res) => {
  const client = model.findClientByUser(req.user);
  if (client) {
    const domains = await client.getDomains();
    res.send(domains);
  } else {
    res.sendStatus(404);
  }
});

router.get('/domains/:domainId/talks', (req, res) => {
  console.log(req.method, req.path);
  res.send('');
});

router.get('/domains/:domainId/talks/:talkId/messages', (req, res) => {
  console.log(req.method, req.path);
  res.send('');
});

module.exports = router;
