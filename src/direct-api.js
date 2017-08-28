const router = require('express').Router();

router.get('/domains', (req, res) => {
  console.log(req.method, req.path);
  res.send('');
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
