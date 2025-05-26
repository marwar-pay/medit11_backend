import express from 'express';
import SquadController from '../controllers/Squad.controller.js';

const router = express.Router();

router.route("/").get(SquadController.getSquadById);

export default router;