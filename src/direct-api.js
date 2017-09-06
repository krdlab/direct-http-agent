const router = require('express').Router();
const model  = require('./model');

const findClient = (req, res, next) => {
  const client = model.findClientByUser(req.user);
  if (client) {
    req.client = client;
    next();
  } else {
    res.sendStatus(404);
  }
};

router.get('/domains', findClient, async (req, res) => {
  const domains = await req.client.getDomains();
  res.send(domains);
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