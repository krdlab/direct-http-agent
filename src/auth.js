// file: src/authorize.js

const model = require('./model');

module.exports = {
  checkSession(req, res, next) {
    if (req.session.user) {
      next();
    } else {
      res.redirect('/login');
    }
  },
  checkApiToken(req, res, next) {
    const auth = req.header('Authorization');
    const apiToken = (auth || '').split(' ')[1];
    model.findUserByApiToken(apiToken)
      .then(user => {
        if (!user) { throw 'not found'; }
        req.user = user;
        next();
      })
      .catch(err => {
        console.log(JSON.stringify(err));
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.sendStatus(403);
      });
  }
};