import axios from "axios";

class Team {
    async getTeamDetailsById(idsArray) {
        try {
            const uniqueIds = [...new Set(idsArray)];
            const teamNames = await Promise.all(uniqueIds.map(async id => {
                return axios.get(`https://cricket.sportmonks.com/api/v2.0/teams/${id}?api_token=${process.env.SPORTMONKS_API_KEY}`)
                    .then(response => {
                        if (response.data.hasOwnProperty("data") && response.data.data) {
                            return response.data.data;
                        } else {
                            throw new Error(`Team with ID ${id} not found`);
                        }
                    })
                    .catch(error => {
                        console.error(`Error retrieving team with ID ${id}:`, error);
                        throw new Error(`Failed to retrieve team with ID ${id}`);
                    });
            }))

            return teamNames;
        } catch (error) {
            console.error("Error retrieving team name:", error);
            throw new Error("Failed to retrieve team name");
        }
    }

    async getSquadDetails(teamIds, seasonId) {
        try {
            const teams = await Promise.all(teamIds.map(async (teamId) => {
                const { data: teamData } = await axios.get(`https://cricket.sportmonks.com/api/v2.0/teams/${teamId}/squad/${seasonId}?api_token=${process.env.SPORTMONKS_API_KEY}`);
                if (teamData.hasOwnProperty("data")) {
                    const team = teamData.data;
                    return {
                        id: team.id,
                        name: team.name,
                        image_path: team.image_path,
                        seasonId: seasonId,
                        code: team.code,
                        squad: team.squad.map(player => {
                            return {
                                id: player.id,
                                first_name: player.firstname,
                                last_name: player.lastname,
                                image_path: player.image_path,
                                position: player.position,
                                batting_style: player.battingstyle,
                                bowling_style: player.bowlingstyle,
                            }
                        })
                    };
                }
                return null;
            }));

            return teams;
        } catch (error) {
            console.error("Error retrieving squad details:", error);
            throw new Error("Failed to retrieve squad details");
        }
    }

}

export default new Team();