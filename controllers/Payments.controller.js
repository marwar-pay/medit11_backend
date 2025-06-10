import mongoose from "mongoose";
import TransactionModel from "../models/transaction.model.js";
import UserModel from "../models/user.model.js";
import APIResponse from "../utilities/APIResponse.js";

class PaymentsController {

    #generateTransactionId() {
        let number = '';
        for (let i = 0; i < 16; i++) {
            number += Math.floor(Math.random() * 10);
        }
        return number;
    }

    async withdraw(req, res) {
        const session = await mongoose.startSession();
        try {
            const { accountNumber, ifscCode, amount, bankName, accountHolderName } = req.body;
            const user = req.user;
            const trxId = this.#generateTransactionId()
            const transactionData = new TransactionModel({
                userId: user._id.toString(),
                type: "withdraw",
                accountNumber,
                ifscCode,
                amount,
                bankName,
                trxId
            })

            if (!transactionData) {
                return res.status(500).json(new APIResponse(500, "Internal server error"));
            }

            const userDetails = await UserModel.findById(user._id.toString());
            if (!userDetails) {
                return res.status(401).json(new APIResponse(401, "Not a valid user"));
            }

            if (amount > userDetails.wallet) {
                res.status(400).json(new APIResponse(400, "Insufficient funds"))
            }

            const payload = {
                userName: "M1749553500383",
                authToken: "f4899caf840841f4e84b055e2dd87c27d1e496a8a20905174ed7cf4c65e71dab",
                mobileNumber: userDetails.mobile,
                accountHolderName,
                ifscCode,
                trxId,
                amount,
                bankName
            }

            const headers = {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            await axios.post("https://api.zanithpay.com/apiAdmin/v1/payout/generatePayOut", payload, { headers }).then(async (resp) => {
                bankingResp = resp?.data?.data
                if (resp.status === 400 || bankingResp?.status === 0) {
                    transactionData.status = "Fail"
                    transactionData.save()
                    return;
                }
            }).catch(async (err) => {
                if (err.response?.status === 400) {
                    transactionData.status = "Fail"
                    transactionData.save({ session })
                    return;
                }
            })
            await UserModel.findByIdAndUpdate(
                user._id.toString(),
                { $inc: { wallet: -amount } },
                { session }
            )
            transactionData.save({ session })
            await session.commitTransaction();
            return res.json(new APIResponse(200, "Success"))
        } catch (error) {
            await session.abortTransaction()
            return res.status(500).json(new APIResponse(500, error.message || "Internal Server error"))
        } finally {
            await session.endSession()
        }
    }

    async callback(req, res) {
        const session = mongoose.startSession()
        try {
            const { trxId, bankRRN, optxId, memberId, status } = req.body;
            const transaction = await TransactionModel.findOne({ trxId, status: "Pending" });
            if (!transaction) {
                return res.status(400).json(new APIResponse(400, "Transaction already processed or not found"))
            }

            if (status.toLowerCase() === "failed") {
                await TransactionModel.findOneAndUpdate({ trxId },
                    { status: "Fail" },
                    { session }
                )
                await UserModel.findByIdAndUpdate(transaction.userId.toString(),
                    { $inc: { wallet: +transaction.amount } }
                )
            } else {
                await TransactionModel.findOneAndUpdate({ trxId },
                    { status: "Success", optxId, bankRRN },
                    { session }
                )
            }

            return res.json(new APIResponse(200, "success"))

        } catch (error) {

        }
    }
}

export default new PaymentsController()