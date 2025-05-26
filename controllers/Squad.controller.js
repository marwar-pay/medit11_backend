import axios from "axios";
import APIResponse from "../utilities/APIResponse.js";

class SquadController {
    async getSquadById(req, res) {
        try {
            const { ids, leagueId } = req.query;
            const teamIds = ids.split(',').map(id => id.trim());

            const { data: seasonData } = await axios.get(`https://cricket.sportmonks.com/api/v2.0/seasons?api_token=${process.env.SPORTMONKS_API_KEY}&filter[league_id]=${leagueId}&sort=-code`);

            if (seasonData.hasOwnProperty("data") && seasonData.data.length > 0) {
                const season = seasonData.data[0];

                const teams = await Promise.all(teamIds.map(async (teamId) => {
                    console.log(`https://cricket.sportmonks.com/api/v2.0/teams/${teamId}/squad/${season.id}?api_token=${process.env.SPORTMONKS_API_KEY}`);

                    const { data: teamData } = await axios.get(`https://cricket.sportmonks.com/api/v2.0/teams/${teamId}/squad/${season.id}?api_token=${process.env.SPORTMONKS_API_KEY}`);

                    if (teamData.hasOwnProperty("data")) {
                        const team = teamData.data;
                        return {
                            id: team.id,
                            name: team.name,
                            image_path: team.image_path,
                            squad: team.squad.map(player => {
                                return {
                                    id: player.id,
                                    first_name: player.first_name,
                                    last_name: player.last_name,
                                    image_path: player.image_path,
                                    position: player.position,
                                    batting_style: player.batting_style,
                                    bowling_style: player.bowling_style,
                                }
                            })
                        };
                    }
                    return null;
                }));
                console.log(" Squad.controller.js:29 ~ SquadController ~ teams ~ teams:", teams);

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