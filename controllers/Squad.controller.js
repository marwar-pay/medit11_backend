import axios from "axios";
import APIResponse from "../utilities/APIResponse.js";
import Team from "../utilities/Team.js";

class SquadController {
    async getSquadById(req, res) {
        try {
            const { ids, leagueId } = req.query;
            const teamIds = ids.split(',').map(id => id.trim());

            const { data: seasonData } = await axios.get(`https://cricket.sportmonks.com/api/v2.0/seasons?api_token=${process.env.SPORTMONKS_API_KEY}&filter[league_id]=${leagueId}&sort=-code`);

            if (seasonData.hasOwnProperty("data") && seasonData.data.length > 0) {
                const season = seasonData.data[0];
                const teams = await Team.getSquadDetails(teamIds, season.id);

                return res.json(new APIResponse(200, "Squad retrieved successfully", teams.filter(team => team !== null)));
            }
            throw new Error("No season data found for the given league ID.");

        } catch (error) {
            console.error("Error retrieving team name:", error);
            res.status(500).json(new APIResponse(500, "Error retrieving squad", null));
        }
    }
}

export default new SquadController();