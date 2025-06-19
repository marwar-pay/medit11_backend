import mongoose, { mongo } from "mongoose";

const TransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["withdraw", "deposit"],
        required: true
    },
    accountNumber: {
        type: String
    },
    ifscCode: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    bankName: {
        type: String
    },
    status: {
        type: String,
        enum: ["Pending", "Success", "Fail"],
        default: "Pending"
    },
    bankRRN: {
        type: String,
        default: ""
    },
    optxId: {
        type: String,
        default: ""
    },
    trxId: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model("Transactions", TransactionSchema);