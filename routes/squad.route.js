import express from 'express';
import SquadController from '../controllers/Squad.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.route("/").get(auth, SquadController.getSquadById);

export default router;