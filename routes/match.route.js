import express from 'express';
import MatchController from '../controllers/Match.controller.js';

const router = express.Router();

router.route("/").get(MatchController.getMatches.bind(MatchController));

export default router;