import express from 'express';
import ContestsController from '../controllers/Contests.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.route("/contest-fee").get(auth, ContestsController.getContestFee);

router.route("/joined-contests").get(auth, ContestsController.getJoinedContests);

export default router;