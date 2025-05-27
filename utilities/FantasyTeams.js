import axios from "axios";
import Team from "./Team.js";
import FantasyPointsPerMatchModel from "../models/fantasyPoint.model.js";
import fantasyPointsSystem from "../config/fantasyPointsSystem.js";

class FantasyTeams {

    constructor() {
        this.lastUpdateTime = 0;
    }


    async updateFantasyPoints(matchId) {
        const now = Date.now();
        const TWO_MINUTES = 2 * 60 * 1000;

        if (now - this.lastUpdateTime < TWO_MINUTES) {
            console.log("updateFantasyPoints called too soon. Skipping...");
            return;
        }
        this.lastUpdateTime = now;

        try {
            // const { data: liveMatches } = await axios.get(`https://cricket.sportmonks.com/api/v2.0/livescores?api_token=${process.env.SPORTMONKS_API_KEY}`);
            const { data } = await axios.get(`https://cricket.sportmonks.com/api/v2.0/fixtures/65603?api_token=${process.env.SPORTMONKS_API_KEY}&include=batting,bowling,scoreboards,balls,balls.batsman,balls.bowler,balls.batsmanout,balls.catchstump,balls.runoutby`)

            if (!data.hasOwnProperty("data") || data.data.length === 0) {
                return [];
            }

            const liveMatch = data.data;
            if (liveMatch.status === "NS") {
                return [];
            }

            let isExists = await FantasyPointsPerMatchModel.findOne({ matchId });
            if (!isExists) {
                const result = [];
                const teams = await Team.getSquadDetails([liveMatch.localteam_id, liveMatch.visitorteam_id], liveMatch.season_id);
                for (const team of teams) {
                    for (const player of team.squad) {
                        result.push({
                            playerId: player.id,
                            teamId: team.id,
                            fantasyPoints: 0,
                            playerName: player.first_name + " " + player.last_name,
                            playerImage: player.image_path,
                            role: player.position.name
                        });
                    }
                }
                const fantasyPointsData = {
                    matchId: liveMatch.id,
                    seasonId: liveMatch.season_id,
                    players: result
                }
                isExists ??= await FantasyPointsPerMatchModel.create(fantasyPointsData);
            }

            data.data.batting.map(bat => {
                const score = bat.score || 0;
                const balls = bat.ball || 0;
                const strickRate = bat.rate || score / balls * 100 || 0;
                const fours = bat.four_x;
                const sixes = bat.six_x;
                let points = 0;
                const battingPointSystem = fantasyPointsSystem.find(x => x.type === "batting").points;
                points += battingPointSystem.run * score;
                points += battingPointSystem.boundary_bonus * fours;
                points += battingPointSystem.six_bonus * sixes;
                const strickRatePointSystem = fantasyPointsSystem.find(x => x.type === "strickRate");
                if (balls > strickRatePointSystem.min_balls) {
                    if (strickRate > 170) {
                        points += strickRatePointSystem.points.above_170;
                    } else if (strickRate > 150) {
                        points += strickRatePointSystem.points["150.01_to_170"];
                    } else if (strickRate >= 130) {
                        points += strickRatePointSystem.points["130_to_150"];
                    } else if (strickRate > 60 && strickRate < 70 && data.data.type === "T20") {
                        points -= strickRatePointSystem.points["60_to_70"]
                    } else if (strickRate > 50 && strickRate < 60 && data.data.type === "T20") {
                        points -= strickRatePointSystem.points["50_to_59.99"]
                    } else if (data.data.type === "T20" && strickRate < 50) {
                        points -= strickRatePointSystem.points.below_50;
                    }
                }
            })

        } catch (error) {
            console.error("Error in getFantasyTeams:", error);
        }
    }
}

export default new FantasyTeams();