import axios from "axios";
import APIResponse from "../utilities/APIResponse.js";

class LeagueController {
    async getLeagues(req, res) {
        try {
            const { leagueId = '' } = req.query;
            
            const { data } = await axios.get(`https://cricket.sportmonks.com/api/v2.0/leagues?api_token=${process.env.SPORTMONKS_API_KEY}&${leagueId}`);

            if (data.hasOwnProperty("data") && data.data.length > 0) {
                const matches = data.data.map(match => ({
                    id: match.id,
                    name: match.name,
                    country: match.country,
                    season: match.season,
                    logo: match.image_path,
                    code: match.code,
                }));
                return res.json(new APIResponse(200, "Matches retrieved successfully", matches));
            }
            return res.status(404).json(new APIResponse(404, "No leagues found"));

        } catch (error) {
            console.error("Error retrieving leagues:", error.response.data);
            return res.status(500).json(new APIResponse(500, "Failed to retrieve leagues"));
        }
    }
}

export default new LeagueController();