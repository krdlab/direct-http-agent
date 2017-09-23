// file: src/auth.js
import { Request, Response, NextFunction } from 'express';
import * as models from './models';

export function checkSession(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

export function checkApiToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.header('Authorization');
  const apiToken = (auth || '').split(' ')[1];
  models.findUserByApiToken(apiToken)
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
};

export interface CheckedRequest extends Request {
  client: models.DirectClientProxy;
}

export function findClient(req: CheckedRequest, res: Response, next: NextFunction) {
  const client = models.findClientByUser(req.user);
  if (client) {
    req.client = client;
    next();
  } else {
    res.sendStatus(404);
  }
};