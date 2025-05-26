import express from 'express';
import LeagueController from '../controllers/League.controller.js';

const router = express.Router();

router.route('/').get(LeagueController.getLeagues);

export default router;