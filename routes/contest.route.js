import express from 'express';
import ContestFinanceController from '../controllers/ContestFinance.controller.js';

const router = express.Router();

router.route("/").get(ContestFinanceController.getContestFee);

export default router;