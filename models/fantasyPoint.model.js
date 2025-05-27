import mongoose from "mongoose";

const playerPointsSchema = new mongoose.Schema({
    playerId: {
        type: Number,
        required: true,
    },
    teamId: {
        type: Number,
        required: true,
    },
    fantasyPoints: {
        type: Number,
        required: true,
    },
    playerName: {
        type: String,
        required: true,
    },
    playerImage: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    }
}, {_id: false, versionKey: false });

const fantasyPointsPerMatchSchema = new mongoose.Schema({
    matchId: {
        type: Number,
        required: true,
        unique: true,
    },
    seasonId: {
        type: Number,
        required: true,
    },
    players: {
        type: [playerPointsSchema],
        required: true,
    }
},
    { timestamps: true, versionKey: false });

export default  mongoose.model("FantasyPointsPerMatch", fantasyPointsPerMatchSchema);
;
