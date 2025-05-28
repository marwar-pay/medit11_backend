import mongoose from "mongoose";

const fantasyTeamSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  players: {
    type: [Number],
    validate: {
      validator: function (v) {
        return v.length === 11;
      },
      message: props => `Fantasy team must have exactly 11 players, but got ${props.value.length}`,
    },
    required: true,
  },
  contestPrize: {
    type: new mongoose.Schema({
      entree_fee: {
        type: Number,
        required: true,
      },
      prize: {
        type: Number,
        required: true,
      },
      prize_distribution: {
        type: Object,
        required: true,
      }
    }, { _id: false }),
    required: true
  },
  matchId: {
    type: Number,
    required: true,
  },
  seasonId: {
    type: Number,
    required: true,
  },
  localTeamName: {
    type: String,
    required: true,
  },
  localTeamCode: {
    type: String,
    required: true,
  },
  localTeamLogo: {
    type: String,
    required: true,
  },
  visitorTeamName: {
    type: String,
    required: true,
  },
  visitorTeamCode: {
    type: String,
    required: true,
  },
  visitorTeamLogo: {
    type: String,
    required: true,
  },
  localTeamId: {
    type: Number,
    required: true,
  },
  visitorTeamId: {
    type: Number,
    required: true,
  },
  startingAt: {
    type: Date,
    required: true,
  },
  leagueId: {
    type: Number,
    required: true
  },

}, {
  timestamps: true,
  versionKey: false,
});

export default mongoose.model("FantasyTeam", fantasyTeamSchema);
