import PrizeDistributionModel from "../models/prizeDistribution.model";
import APIResponse from "../utilities/APIResponse";

class FantasyTeamController {
    async createFantasyTeam(req, res) {
        try {
            const { players, contestPrize } = req.body;
            const user = req.user;

            const isValidPrize = await PrizeDistributionModel.find();
            const index = isValidPrize[0].distribution.findIndex(item => item.entree_fee === contestPrize);
            if (index === -1) {
                return res.status(400).json(new APIResponse(400, "Invalid contest prize"));
            }

            
        } catch (error) {
            console.error("Error in createFantasyTeam:", error);
            res.status(500).json(new APIResponse(500, "Internal Server Error", error.message));

        }
    }
}