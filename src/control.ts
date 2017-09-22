// file: src/control.js
import { Router } from 'express';
import * as model from './model';

const router = Router();

router.post('/restart', async (req, res) => {
  await model.restartClient(req.user);
  res.sendStatus(200);
});

export default router;