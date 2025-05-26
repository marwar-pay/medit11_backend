import axios from "axios";
import APIResponse from "../utilities/APIResponse.js";
import Team from "../utilities/Team.js";

class MatchController {
    async getMatches(req, res) {
        try {
            let { page = 1, leagueId } = req.query;
            page = parseInt(page, 10);
            if (isNaN(page) || page < 1) {
                page = 1;
            }
            if (!leagueId) {
                return res.status(400).json(new APIResponse(400, "League ID is required"));
            }
            const today = new Date().toISOString().split('T')[0];
            const startsBetween = this.#getDates(today, 2, 5);

            const { data } = await axios.get(`https://cricket.sportmonks.com/api/v2.0/fixtures?api_token=${process.env.SPORTMONKS_API_KEY}&filter[league_id]=${leagueId}&&filter[starts_between]=${startsBetween}&page=${page}&sort=starting_at`)

            if (data.hasOwnProperty("data") && data.data.length > 0) {

                const teamIds = data.data.reduce((acc, match) => {
                    if (match.localteam_id) acc.push(match.localteam_id);
                    if (match.visitorteam_id) acc.push(match.visitorteam_id);
                    return acc;
                }
                    , []);

                const teamDetails = await Team.getTeamDetailsById(teamIds);

                const teamMap = {};
                teamDetails.forEach(team => {
                    teamMap[team.id] = team;
                });

                const matches = data.data.map(match => ({
                    id: match.id,
                    league_id: match.league_id,
                    season_id: match.season_id,
                    starting_at: match.starting_at,
                    status: match.status,
                    localteam_id: match.localteam_id,
                    visitorteam_id: match.visitorteam_id,
                    localteam_name: teamMap[match.localteam_id].name,
                    visitorteam_name: teamMap[match.visitorteam_id].name,
                    // localteam_score: match.localteam_score,
                    // visitorteam_score: match.visitorteam_score,
                    localteam_logo: teamMap[match.localteam_id].image_path,
                    visitorteam_logo: teamMap[match.visitorteam_id].image_path,
                }));

                res.json(new APIResponse(200, "Matches retrieved successfully", matches));
            }

        } catch (error) {
            console.error("Error retrieving matches:", error);
            return res.status(500).json({ message: "Failed to retrieve matches" });
        }
    }

    #getDates(startDateStr, totalDates, gapDays = 1) {
        const dates = [];
        let currentDate = new Date(startDateStr);

        for (let i = 0; i < totalDates; i++) {
            const formatted = currentDate.toISOString().split('T')[0];
            dates.push(formatted);
            currentDate.setDate(currentDate.getDate() + gapDays);
        }

        return dates.toString();
    }

}

export default new MatchController();