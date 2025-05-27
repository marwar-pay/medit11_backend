import mongoose from "mongoose";


const fantasyPointsSystem = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ["batting", "bowling", "fielding", "keeping", "economyRate", "strickRate"],
        unique: true,
    },
    points: {
        type: Map,
        of: Number,
        required: true,
    },
    min_overs: {
        type: Number
    },
    min_balls: {
        type: Number
    }
});

export default  mongoose.model("FantasyPointsSystem", fantasyPointsSystem);
