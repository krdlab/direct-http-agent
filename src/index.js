require('dotenv').load();

const express     = require('express');
const bodyParser  = require('body-parser');
const session     = require('express-session');
const passport    = require('passport');
const crypto      = require('crypto');
const model       = require('./model');
const auth        = require('./auth');
const webhooks    = require('./webhooks');
const dapi        = require('./direct-api');
const control     = require('./control');

// passport
const DirectPassportStrategy = require('passport-direct-openidconnect').Strategy;
const directPassportOptions = {
  clientID:     process.env.NODE_DIRECT_CLIENT_ID,
  clientSecret: process.env.NODE_DIRECT_CLIENT_SECRET,
  callbackURL:  process.env.NODE_SERVICE_BASE_URL + '/login/cb',
  scope:        ['email', 'direct.users.me.readonly', 'direct.api_access_tokens'],
  session:      false
};
passport.use(new DirectPassportStrategy(directPassportOptions, model.passportAuthorized));

// express
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
app.use('/webhooks', auth.checkApiToken, webhooks);
app.use('/dapi', auth.checkApiToken, dapi);
app.use('/control', auth.checkApiToken, control);

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

// start service
app.listen(3000, () => { console.log('service is listening on port 3000...'); });
