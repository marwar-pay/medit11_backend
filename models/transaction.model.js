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
        type: String,
        required: true
    },
    ifscCode: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    bankName: {
        type: String,
        required: true
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