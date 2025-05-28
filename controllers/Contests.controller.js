import FantasyTeamModel from "../models/fantasyTeam.model.js";
import PrizeDistributionModel from "../models/prizeDistribution.model.js";
import APIResponse from "../utilities/APIResponse.js";

class ContestController {
    async getContestFee(req, res) {
        try {
            const contestFees = await PrizeDistributionModel.find();
            return res.json(new APIResponse(200, "Contest fees retrieved successfully", contestFees));
        } catch (error) {
            console.error("Error in getContestFee:", error);
            res.status(500).json(new APIResponse(500, "Internal Server Error", error.message));
        }
    }

    async getJoinedContests(req, res) {
        try {
            const userId = req.user._id;
            const projection = [
                "contestPrize",
                "matchId",
                "seasonId",
                "contestPrize",
                "localTeamName",
                "localTeamCode",
                "localTeamLogo",
                "visitorTeamName",
                "visitorTeamLogo",
                "visitorTeamCode",
                "localTeamId",
                "visitorTeamId",
                "startingAt",
                "_id",
            ].join(" ");
            const contests = await FantasyTeamModel.find({ userId }).select(projection);
            if (contests.length === 0) {
                return res.status(404).json(new APIResponse(404, "No contests found for this user"));
            }
            return res.json(new APIResponse(200, "Joined contests retrieved successfully", contests));
        } catch (error) {
            console.error("Error in getJoinedContests:", error);
            res.status(500).json(new APIResponse(500, "Internal Server Error", error.message));

        }
    }
}

export default new ContestController();