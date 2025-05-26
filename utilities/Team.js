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
}

export default new Team();