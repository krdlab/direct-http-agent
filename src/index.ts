import * as dotenv from "dotenv";
import * as express from "express";
import * as helmet from "helmet";
import * as bodyParser from "body-parser";
import * as session from "express-session";
import * as passport from "passport";
import * as crypto from "crypto";

dotenv.config({path: "/etc/agent/.env"});

import "./models/datasource";
import * as models from "./models";
import * as auth from "./auth";
import * as routers from "./routers";

// passport
const DirectPassportStrategy = require("passport-direct-openidconnect").Strategy;
const directPassportOptions = {
  clientID:     process.env.NODE_DIRECT_CLIENT_ID,
  clientSecret: process.env.NODE_DIRECT_CLIENT_SECRET,
  callbackURL:  process.env.NODE_SERVICE_BASE_URL + "/login/cb",
  scope:        ["email", "direct.users.me.readonly", "direct.api_access_tokens"],
  session:      false
};
passport.use(new DirectPassportStrategy(directPassportOptions, models.passportAuthorized));

// express
const SERVICE_BASE_URL = process.env.NODE_SERVICE_BASE_URL;
const app = express();

const sessionOptions = {
  name: "sessionid",
  secret: crypto.randomBytes(32).toString("hex"),
  cookie: { secure: false }
};
if (app.get("env") == "production") {
  app.set("trust proxy", 1);
  sessionOptions.cookie.secure = true;
}

app.set("view engine", "pug");
app.use(helmet());
app.use(bodyParser.json());
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use("/webhooks", auth.checkApiToken, routers.webhooks);
app.use("/dapi", auth.checkApiToken, auth.prepareClient, routers.directapi);
app.use("/control", auth.checkApiToken, routers.control);

app.get("/", (req, res) => {
  res.render("index", {});
});
app.get("/login",    passport.authenticate("direct"));
app.get("/login/cb", passport.authenticate("direct", { failureRedirect: "/login", session: false }), (req, res) => {
  req.session!.user = req.user;
  res.redirect("/home");
});
app.get("/home", auth.checkSession, (req, res) => {
  const data = {
    serviceBaseUrl: SERVICE_BASE_URL,
    user: req.session!.user
  };
  res.render("home", data);
});
app.post("/logout", async (req, res) => {
  if (req.session && req.session.user) {
    await models.deleteUser(req.session.user);
    delete req.session.user;
  }
  delete req.user;
  res.redirect("/");
});

models.bootRegisteredUserClients()
  .then(() => {
    // start service
    app.listen(3000, () => { console.log("service is listening on port 3000..."); });
  })
  .catch(console.error);