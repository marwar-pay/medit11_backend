import express from 'express';
import FantasyTeamController from '../controllers/FantasyTeam.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.route("/").post(auth, FantasyTeamController.createFantasyTeam.bind(FantasyTeamController));

router.route("/:id").get(auth, FantasyTeamController.getFantasyTeamById);

router.route("/:id").patch(auth, FantasyTeamController.editFantasyTeam.bind(FantasyTeamController));

export default router;