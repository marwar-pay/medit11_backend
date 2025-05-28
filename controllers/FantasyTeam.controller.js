import axios from "axios";
import PrizeDistributionModel from "../models/prizeDistribution.model.js";
import APIResponse from "../utilities/APIResponse.js";
import FantasyTeamModel from "../models/fantasyTeam.model.js";
import mongoose from "mongoose";
import Team from "../utilities/Team.js";
import FantasyTeams from "../utilities/FantasyTeams.js";
import FantasyPointModel from "../models/fantasyPoint.model.js";

class FantasyTeamController {

    async #prizeDistributionValidator(contestPrize) {
        try {
            const isValidPrize = await PrizeDistributionModel.find();
            const index = isValidPrize[0].distribution.findIndex(item => item.entree_fee === contestPrize);
            if (index === -1) {
                throw new Error("Invalid contest prize");
            }
            return isValidPrize[0].distribution[index];
        } catch (error) {
            console.error("Error in validator:", error);
            throw new Error("Validation failed");
        }
    }

    async createFantasyTeam(req, res) {
        try {
            const { players, contestPrize, matchId, seasonId } = req.body;
            const user = req.user;

            const prizeDistribution = await this.#prizeDistributionValidator(contestPrize);

            const { data } = await axios.get(`https://cricket.sportmonks.com/api/v2.0/fixtures/${matchId}?api_token=${process.env.SPORTMONKS_API_KEY}`);

            if (!data.hasOwnProperty("data") || data.data.length === 0) {
                return res.status(404).json(new APIResponse(404, "Match not found"));
            }

            if (data.data.status === "Finished") {
                return res.status(400).json(new APIResponse(400, "Match is already finished!"))
            }

                const localTeamId = data.data.localteam_id;
            const visitorTeam_id = data.data.visitorteam_id;

            const teams = await Team.getSquadDetails([localTeamId, visitorTeam_id], seasonId);
            if (!teams || teams.length === 0) {
                return res.status(404).json(new APIResponse(404, "Teams not found"));
            }

            const combinedTeamPlayers = [...teams[0].squad, ...teams[1].squad];
            // const playerDetails = combinedTeamPlayers.filter(player => players.some(p => p === player.id));
            const uniqueCombinedPlayers = Array.from(
                new Map(combinedTeamPlayers.map(p => [p.id, p])).values()
            );

            const playerDetails = uniqueCombinedPlayers.filter(player => players.includes(player.id));

            if (playerDetails.length !== players.length) {
                return res.status(400).json(new APIResponse(400, "Some players not found in the teams"));
            }

            const shouldHave = ["Allrounder", "Wicketkeeper", "Batsman", "Bowler"];
            const rolesPresent = new Set(playerDetails.map(player => player?.position?.name));
            const allRolesPresent = shouldHave.every(role => rolesPresent.has(role));

            if (allRolesPresent) {
                const fantasyTeam = {
                    userId: user._id,
                    players: playerDetails.map(player => player.id),
                    contestPrize: prizeDistribution,
                    matchId,
                    seasonId,
                    leagueId: data.data.league_id,
                    localTeamId: data.data.localteam_id,
                    visitorTeamId: data.data.visitorteam_id,
                    startingAt: data.data.starting_at,
                    localTeamName: teams[0].name,
                    localTeamCode: teams[0].code,
                    localTeamLogo: teams[0].image_path,
                    visitorTeamName: teams[1].name,
                    visitorTeamCode: teams[1].code,
                    visitorTeamLogo: teams[1].image_path,
                };

                const isSaved = await FantasyTeamModel.create(fantasyTeam);
                if (!isSaved) {
                    return res.status(500).json(new APIResponse(500, "Failed to create fantasy team"));
                }

                return res.status(201).json(new APIResponse(201, "Fantasy team created successfully", fantasyTeam));
            } else {
                return res.status(400).json(new APIResponse(400, "Not all required player roles are present"));
            }

        } catch (error) {
            console.error("Error in createFantasyTeam:", error);
            const errorMessage = error?.response?.statusText;
            const status = error?.response?.status;
            res.status(status || 500).json(new APIResponse(status || 500, errorMessage || error.message));
        }
    }

    async getFantasyTeamById(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const fantasyTeam = await FantasyTeamModel.findOne({ _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(user._id.toString()) });
            if (!fantasyTeam) {
                return res.status(404).json(new APIResponse(404, "Fantasy team not found"));
            }
            const teams = await Team.getSquadDetails([fantasyTeam.localTeamId, fantasyTeam.visitorTeamId], fantasyTeam.seasonId);
            if (!teams || teams.length === 0) {
                return res.status(404).json(new APIResponse(500, "Internal Server Error"));
            }
            FantasyTeams.updateFantasyPoints.call(FantasyTeams, fantasyTeam.matchId);
            const fantasyPoints = await FantasyPointModel.findOne({ matchId: fantasyTeam.matchId });
            const result = [];

            for (const team of teams) {
                for (const player of team.squad) {
                    if (fantasyTeam.players.includes(player.id)) {
                        result.push({
                            playerId: player.id,
                            firstName: player.first_name,
                            lastName: player.last_name,
                            position: player.position?.name,
                            battingStyle: player.batting_style,
                            bowlingStyle: player.bowling_style,
                            playerImage: player.image_path,
                            teamName: team.name,
                            teamImage: team.image_path,
                            fantasyPoint: fantasyPoints?.players?.find(fp => fp.playerId === player.id)?.fantasyPoints || 0
                        });
                    }
                }
            }
            const userFantasyTeam = fantasyTeam.toObject();
            delete userFantasyTeam.players;
            delete userFantasyTeam.contestPrize;
            res.json(new APIResponse(200, "Fantasy team retrieved successfully", {
                fantasyTeam: userFantasyTeam,
                players: result,
            }));

        } catch (error) {
            console.error("Error in getFantasyTeamById:", error?.response?.data);
            const errorMessage = error?.response?.statusText;
            const status = error?.response?.status;
            res.status(status || 500).json(new APIResponse(status || 500, errorMessage || error.message));
        }
    }

    async editFantasyTeam(req, res) {
        try {
            const { id } = req.params;
            const { players, contestPrize } = req.body;
            const user = req.user;

            if (contestPrize) {
                this.#prizeDistributionValidator(contestPrize);
            }

            const oldFantasyTeam = await FantasyTeamModel.findOne({ _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(user._id) });

            if (!oldFantasyTeam) {
                return res.status(404).json(new APIResponse(404, "Fantasy team not found"));
            }

            const isStarted = new Date(oldFantasyTeam.startingAt) < new Date();
            if (isStarted) {
                return res.status(400).json(new APIResponse(400, "Cannot edit fantasy team after given time"));
            }

            const localTeamId = oldFantasyTeam.localTeamId;
            const visitorTeamId = oldFantasyTeam.visitorTeamId;

            const teams = await Team.getSquadDetails([localTeamId, visitorTeamId], oldFantasyTeam.seasonId);

            if (!teams || teams.length === 0) {
                return res.status(500).json(new APIResponse(500, "Internal Server Error"));
            }

            const combinedTeamPlayers = [...teams[0].squad, ...teams[1].squad];
            const playerDetails = combinedTeamPlayers.filter(player => players.some(p => p === player.id));
            if (playerDetails.length !== players.length) {
                return res.status(400).json(new APIResponse(400, "Some players not found in the teams"));
            }
            const shouldHave = ["Allrounder", "Wicketkeeper", "Batsman", "Bowler"];
            const rolesPresent = new Set(playerDetails.map(player => player?.position?.name));
            const allRolesPresent = shouldHave.every(role => rolesPresent.has(role));
            if (!allRolesPresent) {
                return res.status(400).json(new APIResponse(400, "Not all required player roles are present"));
            }
            const updatedFantasyTeam = {
                ...oldFantasyTeam.toObject(),
                players: playerDetails.map(player => player.id),
                contestPrize: contestPrize || oldFantasyTeam.contestPrize,
            };
            const updatedTeam = await FantasyTeamModel.findByIdAndUpdate(id, updatedFantasyTeam, { new: true });
            if (!updatedTeam) {
                return res.status(500).json(new APIResponse(500, "Failed to update fantasy team"));
            }
            const result = [];
            for (const team of teams) {
                for (const player of team.squad) {
                    if (updatedFantasyTeam.players.includes(player.id)) {
                        result.push({
                            playerId: player.id,
                            firstName: player.first_name,
                            lastName: player.last_name,
                            position: player.position?.name,
                            battingStyle: player.batting_style,
                            bowlingStyle: player.bowling_style,
                            playerImage: player.image_path,
                            teamName: team.name,
                            teamImage: team.image_path,
                        });
                    }
                }
            }
            res.json(new APIResponse(200, "Fantasy team updated successfully", {
                fantasyTeam: updatedFantasyTeam,
                players: result,
            }));

        } catch (error) {
            console.error("Error in editFantasyTeam:", error);
            const errorMessage = error?.response?.statusText;
            const status = error?.response?.status;
            res.status(status || 500).json(new APIResponse(status || 500, errorMessage || error.message));
        }
    }
}

export default new FantasyTeamController();