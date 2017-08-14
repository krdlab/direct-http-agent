require('dotenv').load();

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const DirectPassportStrategy = require('passport-direct-openidconnect').Strategy;
const crypto = require('crypto');

const Direct = require("direct-js").DirectAPI;

const model = require('./model');
const authorize = require('./authorize');
const webhooks = require('./webhooks');
const api = require('./resources');

const authenticated = async (iss, sub, profile, accessToken, refreshToken, next) => {
  try {
    const user = await model.findOrCreateUserById(sub, profile, accessToken);
    next(null, user);
  } catch (err) {
    next(err);
  }
};

passport.use(
  new DirectPassportStrategy(
    {
      clientID: process.env.NODE_DIRECT_CLIENT_ID,
      clientSecret: process.env.NODE_DIRECT_CLIENT_SECRET,
      callbackURL: process.env.NODE_SERVICE_BASE_URL + '/login/cb',
      scope:['email', 'direct.users.me.readonly', 'direct.api_access_tokens'],
      session: false
    },
    authenticated
  )
);

const app = express();

app.use(bodyParser.json());
app.use(passport.initialize());

app.get('/login', passport.authenticate('direct'));

app.get('/login/cb', passport.authenticate('direct', { failureRedirect: '/login', session: false }),
  (req, res) => {
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.send(req.user);  // FIXME
  }
);

app.use('/webhooks', authorize);
app.use('/webhooks', webhooks);

app.use('/api', authorize);
app.use('/api', api);

app.listen(3000, () => {
  console.log('service is listening on port 3000...');
});
