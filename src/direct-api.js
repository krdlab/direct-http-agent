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

router.get('/domains/:domainId/talks', findClient, async (req, res) => {
  const talks = await req.client.getTalks(req.params.domainId);
  res.send(talks);
});

router.get('/domains/:domainId/talks/:talkId/messages', (req, res) => {
  console.log(req.method, req.path);  // TODO
  res.send('');
});

router.post('/domains/:domainId/talks/:talkId/messages', findClient, async (req, res) => {
  const q = req.params;
  const result = await req.client.sendTextMessage(q.domainId, q.talkId, req.body)
    .then(r => ({status: 200, body: r}))
    .catch(err => {
      if (err === 'NotFound') {
        return {status: 404, body: ''};
      } else {
        return {status: 500, body: ''};
      }
    });
  res.status(result.status).send(result.body);
});

module.exports = router;