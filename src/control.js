// file: src/control.js
const router = require('express').Router();
const model  = require('./model');

router.post('/restart', async (req, res) => {
  await model.restartClient(req.user);
  res.sendStatus(200);
});

module.exports = router;