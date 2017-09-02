// file: src/authorize.js

module.exports = {
  checkSession(req, res, next) {
    if (req.session.user) {
      next();
    } else {
      res.redirect('/login');
    }
  },
  checkApiToken(req, res, next) {
    res.header('Content-Type', 'application/json; charset=utf-8');
    const auth = req.header('Authorization');
    const apiToken = (auth || '').split(' ')[1];
    console.info(`token = ${apiToken}`);
    if (!!apiToken) {
      next();
    } else {
      res.sendStatus(403);
    }
  }
};
