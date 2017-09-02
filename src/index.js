require('dotenv').load();

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const DirectPassportStrategy = require('passport-direct-openidconnect').Strategy;
const crypto = require('crypto');

const Direct = require("direct-js").DirectAPI;

const model = require('./model');
const auth = require('./authorize');
const webhooks = require('./webhooks');
const dapi = require('./direct-api');

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

const sessionOptions = {
  secret: crypto.randomBytes(32).toString('hex'),
  cookie: {}
};
if (app.get('env') == 'production') {
  sessionOptions.cookie.secure = true;
}

app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(session(sessionOptions));
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.render('index', {});
});

app.get('/login',    passport.authenticate('direct'));
app.get('/login/cb', passport.authenticate('direct', { failureRedirect: '/login', session: false }), (req, res) => {
  req.session.user = req.user;
  res.redirect('/home');
});

app.get('/home', auth.checkSession, (req, res) => {
  res.render('home', {user: req.session.user});
});

app.use('/webhooks', auth.checkApiToken);
app.use('/webhooks', webhooks);

app.use('/dapi', auth.checkApiToken);
app.use('/dapi', dapi);

app.listen(3000, () => {
  console.log('service is listening on port 3000...');
});
