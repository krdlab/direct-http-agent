// file: src/authorize.js

module.exports = (req, res, next) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  const auth = req.header('Authorization');
  const apiToken = (auth || '').split(' ')[1];
  console.info(`token = ${apiToken}`);
  if (!!apiToken) {
    next();
  } else {
    res.sendStatus(403);
  }
};
