import express from 'express';
import MatchController from '../controllers/Match.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.route("/").get(auth, MatchController.getMatches.bind(MatchController));

export default router;