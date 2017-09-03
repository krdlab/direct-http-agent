// file: src/control.js
const router = require('express').Router();
const auth = require('./auth');
const model  = require('./model');

router.post('/restart', auth.checkApiToken, async (req, res) => {
  await model.restartClient(req.user);
  res.sendStatus(200);
});

module.exports = router;
