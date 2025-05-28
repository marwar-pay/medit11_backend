import express from 'express';
import FantasyTeamController from '../controllers/FantasyTeam.controller.js';
import auth from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { editFantasyTeamSchema, fantasyTeamSchema, paramsSchema } from '../validators/fantasyTeam.validator.js';

const router = express.Router();

router.route("/").post(auth, validate("body", fantasyTeamSchema), FantasyTeamController.createFantasyTeam.bind(FantasyTeamController));

router.route("/:id").get(auth, validate("params", paramsSchema), FantasyTeamController.getFantasyTeamById);

router.route("/:id").patch(auth, validate("body", editFantasyTeamSchema), validate("params", paramsSchema), FantasyTeamController.editFantasyTeam.bind(FantasyTeamController));

export default router;