// file: src/control.js
import { Router } from 'express';
import * as models from '../models';

const router = Router();

router.post('/restart', async (req, res) => {
  await models.restartClient(req.user);
  res.sendStatus(200);
});

export default router;