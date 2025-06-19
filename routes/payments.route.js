import express from 'express';
import auth from '../middlewares/auth.js';
import PaymentsController from '../controllers/Payments.controller.js';
import validate from '../middlewares/validate.js';
import { withdrawSchema } from '../validators/payment.validator.js';

const router = express.Router();

router.route("/deposit").post(auth, PaymentsController.deposit.bind(PaymentsController))

router.route('/withdraw').post(auth, validate("body", withdrawSchema), PaymentsController.withdraw.bind(PaymentsController));

export default router;