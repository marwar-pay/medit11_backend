import express from 'express';
import SquadController from '../controllers/Squad.controller.js';
import auth from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { squadSchema } from '../validators/squad.validator.js';

const router = express.Router();

router.route("/").get(auth, validate("query", squadSchema), SquadController.getSquadById);

export default router;