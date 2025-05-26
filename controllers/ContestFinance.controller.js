import PrizeDistributionModel from "../models/prizeDistribution.model.js";
import APIResponse from "../utilities/APIResponse.js";

class ContestFinanceController {
    async getContestFee(req, res) {
        try {
            const contestFees = await PrizeDistributionModel.find();
            return res.json(new APIResponse(200, "Contest fees retrieved successfully", contestFees));
        } catch (error) {
            console.error("Error in getContestFee:", error);
            res.status(500).json(new APIResponse(500, "Internal Server Error", error.message));
        }
    }
}

export default new ContestFinanceController();