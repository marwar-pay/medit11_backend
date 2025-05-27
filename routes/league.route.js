import express from 'express';
import LeagueController from '../controllers/League.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.route('/').get(auth, LeagueController.getLeagues);

export default router;