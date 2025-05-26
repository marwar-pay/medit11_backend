import mongoose from "mongoose";

const prizeDistributionSchema = new mongoose.Schema({
    entree_fee: {
        type: Number,
        required: true,
    },
    prize: {
        type: Number,
        required: true,
    },
    prize_distribution: {
        type: Map,
        of: Number,
        required: true,
    }
}, { _id: false });

const distributionGroupSchema = new mongoose.Schema({
    distribution: {
        type: [prizeDistributionSchema],
        required: true,
    }
}, { timestamps: true });

export default mongoose.model("PrizeDistribution", distributionGroupSchema, "prizedistribution");
