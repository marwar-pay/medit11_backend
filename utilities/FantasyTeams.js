import axios from "axios";
import Team from "./Team.js";
import FantasyPointsPerMatchModel from "../models/fantasyPoint.model.js";
import t20FantasyPointsSystem from "../config/t20FantasyPointsSystem.js";
import FantasyTeamModel from "../models/fantasyTeam.model.js";
import prizeDistributionModel from "../models/prizeDistribution.model.js";

class FantasyTeams {
    constructor() {
        this.lastUpdateTimes = new Map();
    }

    async updateFantasyPoints(matchId) {
        try {
            const now = Date.now();
            const TWO_MINUTES = 2 * 60 * 1000;

            const lastUpdateTime = this.lastUpdateTimes.get(matchId) || 0;

            if (now - lastUpdateTime < TWO_MINUTES) {
                return;
            }

            let isExists = await FantasyPointsPerMatchModel.findOne({ matchId });

            if (isExists && isExists.isFinished) {
                return;
            }

            // const { data: liveMatches } = await axios.get(`https://cricket.sportmonks.com/api/v2.0/livescores?api_token=${process.env.SPORTMONKS_API_KEY}`);
            const { data } = await axios.get(`https://cricket.sportmonks.com/api/v2.0/fixtures/${matchId}?api_token=${process.env.SPORTMONKS_API_KEY}&include=batting,bowling,scoreboards,balls,balls.batsman,balls.bowler,balls.batsmanout,balls.catchstump,balls.runoutby`)

            if (!data.hasOwnProperty("data") || data.data.length === 0) {
                return [];
            }

            const liveMatch = data.data;
            if (liveMatch.status === "NS") {
                return [];
            } else if (liveMatch.status === "Finished") {
                this.#winnersHandler(matchId)
                return;
            }

            this.lastUpdateTimes.set(matchId, now);

            const upcomingStatuses = await FantasyTeamModel.find({ matchId, matchStatus: "Upcoming" });
            Promise.all(upcomingStatuses.map(upcomingStatus => {
                return FantasyTeamModel.findByIdAndUpdate(upcomingStatus._id.toString(), {
                    matchStatus: "Live"
                })
            }))

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

            await this.#fantasyPointsHandler(liveMatch)
        } catch (error) {
            console.error("Error in getFantasyTeams:", error);
        }
    }

    async #fantasyPointsHandler(matchData) {
        const points = {};

        const getPoints = (type) => t20FantasyPointsSystem.find(x => x.type === type)?.points || {};
        const getPlayerKey = (playerId) => playerId.toString();

        const battingPts = getPoints("batting");
        const bowlingPts = getPoints("bowling");
        const fieldingPts = getPoints("fielding");

        const battingStats = {};
        const bowlingStats = {};

        for (const ball of matchData.balls || []) {
            const { batsman_id, bowler_id, batsmanout_id, catchstump_id, runout_by_id, score } = ball;

            const batsmanKey = getPlayerKey(batsman_id);
            const bowlerKey = getPlayerKey(bowler_id);

            // === Batting points ===
            if (score?.runs) {
                points[batsmanKey] = (points[batsmanKey] || 0) + (score.runs * battingPts.run);
            }

            if (score?.four) points[batsmanKey] += battingPts.boundary_bonus;
            if (score?.six) points[batsmanKey] += battingPts.six_bonus;

            // Save batting stats
            if (!battingStats[batsmanKey]) battingStats[batsmanKey] = { runs: 0, balls: 0 };
            battingStats[batsmanKey].runs += score?.runs || 0;
            if (score?.ball) battingStats[batsmanKey].balls += 1;

            // === Bowling points ===
            if (!bowlingStats[bowlerKey]) bowlingStats[bowlerKey] = { dots: 0, wickets: 0, overs: 0, maidenBalls: 0, balls: 0, runs: 0 };

            if (score?.ball && score.runs === 0) {
                points[bowlerKey] = (points[bowlerKey] || 0) + bowlingPts.dot_ball;
                bowlingStats[bowlerKey].dots += 1;
            }

            if (score?.ball) {
                bowlingStats[bowlerKey].balls += 1;
                bowlingStats[bowlerKey].runs += score.runs || 0;
            }

            if (score?.is_wicket && batsmanout_id) {
                points[bowlerKey] = (points[bowlerKey] || 0) + bowlingPts.wicket;

                // LBW or bowled
                const isLbwOrBowled = !catchstump_id && !runout_by_id;
                if (isLbwOrBowled) points[bowlerKey] += bowlingPts.lbw_bowled_bonus;

                bowlingStats[bowlerKey].wickets += 1;
            }

            // === Fielding points ===
            const fielderIds = [catchstump_id, runout_by_id].filter(Boolean);
            for (const fielderId of fielderIds) {
                const fKey = getPlayerKey(fielderId);
                if (fielderId === catchstump_id) {
                    points[fKey] = (points[fKey] || 0) + fieldingPts.catch;
                } else {
                    points[fKey] = (points[fKey] || 0) + fieldingPts.run_out_hit;
                }
            }
        }

        // Bonus points for batting
        for (const [pid, stat] of Object.entries(battingStats)) {
            const { runs, balls } = stat;
            const sr = balls > 0 ? (runs / balls) * 100 : 0;

            if (runs >= 100) points[pid] += battingPts.bonus_100_runs;
            else if (runs >= 75) points[pid] += battingPts.bonus_75_runs;
            else if (runs >= 50) points[pid] += battingPts.bonus_50_runs;
            else if (runs >= 25) points[pid] += battingPts.bonus_25_runs;
            else if (runs === 0 && balls > 0) points[pid] += battingPts.duck_penalty;

            const strikeRateSystem = t20FantasyPointsSystem.find(x => x.type === "strickRate");
            if (balls >= strikeRateSystem.min_balls) {
                const srPoints = strikeRateSystem.points;
                if (sr > 170) points[pid] += srPoints.above_170;
                else if (sr > 150) points[pid] += srPoints["150.01_to_170"];
                else if (sr >= 130) points[pid] += srPoints["130_to_150"];
                else if (sr > 60 && sr < 70) points[pid] -= srPoints["60_to_70"];
                else if (sr > 50 && sr <= 59.99) points[pid] -= srPoints["50_to_59.99"];
                else if (sr <= 50) points[pid] -= srPoints.below_50;
            }
        }

        // Bonus points for bowling
        for (const [pid, stat] of Object.entries(bowlingStats)) {
            const { wickets, dots } = stat;
            if (wickets >= 5) points[pid] += bowlingPts.five_wicket_bonus;
            else if (wickets >= 4) points[pid] += bowlingPts.four_wicket_bonus;
            else if (wickets >= 3) points[pid] += bowlingPts.three_wicket_bonus;

            // const maidens = Math.floor(dots / 6);
            // points[pid] += maidens * bowlingPts.maiden_over;
        }

        const economyRateSystem = t20FantasyPointsSystem.find(x => x.type === "economyRate");

        for (const [pid, stat] of Object.entries(bowlingStats)) {
            const { runs, balls } = stat;
            const overs = balls / 6;

            if (overs < economyRateSystem.min_overs) continue;

            const econRate = overs > 0 ? runs / overs : 0;
            const econPoints = economyRateSystem.points;

            if (econRate < 5) points[pid] += econPoints.below_5;
            else if (econRate < 6) points[pid] += econPoints["5_to_5.99"];
            else if (econRate <= 7) points[pid] += econPoints["6_to_7"];
            else if (econRate >= 10 && econRate <= 11) points[pid] -= econPoints["10_to_11"];
            else if (econRate > 11 && econRate <= 12) points[pid] -= econPoints["11.01_to_12"];
            else if (econRate > 12) points[pid] -= econPoints.above_12;
        }


        const existing = await FantasyPointsPerMatchModel.findOne({ matchId: matchData.id });
        if (!existing) throw new Error("Match not initialized in DB");

        const updatedPlayers = existing.players.map(player => ({
            ...player.toObject(),
            fantasyPoints: Math.floor(points[player.playerId?.toString()] || 0)
        }));

        existing.players = updatedPlayers;
        await existing.save();

        return updatedPlayers;
    }

    async #winnersHandler(matchId) {
        try {
            const playerPoints = await FantasyPointsPerMatchModel.findOneAndUpdate({ matchId }, {
                isFinished: true
            })
            this.lastUpdateTimes.delete(matchId);
            const playerToPoints = {};
            playerPoints.players.forEach(player => {
                playerToPoints[player.playerId] = player.fantasyPoints;
            })

            const liveAndUpcomingStatuses = await FantasyTeamModel.find({ matchId, matchStatus: { $in: ["Upcoming", "Live"] } });

            const idToToTotalPoints = {};

            liveAndUpcomingStatuses.map(liveOrUpcomingStatus => {
                return idToToTotalPoints[liveOrUpcomingStatus._id] = this.#totalFantasyPointsHandler(liveOrUpcomingStatus.players, playerToPoints);
            });

            const sortedUniqueScores = [...new Set(Object.values(idToToTotalPoints))].sort((a, b) => b - a);

            const finalRanks = {};


            sortedUniqueScores.slice(0, 3).forEach((score, index) => {
                const rank = index + 1;

                Object.entries(idToToTotalPoints).forEach(([id, points]) => {
                    if (points === score) {
                        finalRanks[id] = rank;
                    }
                });
            });

            const prizeMoney = await prizeDistributionModel.findOne({});
            const prizeDistribution = prizeMoney.distribution[0].prize_distribution;
            const idToPrize = {};
            for (const [pid, rank] of Object.entries(finalRanks)) {
                if (rank === 1) {
                    idToPrize[pid] = prizeDistribution.get("1st");
                } else if (rank === 2) {
                    idToPrize[pid] = prizeDistribution.get("2nd");
                } else if (rank === 3) {
                    idToPrize[pid] = prizeDistribution.get("3rd");
                }
            }

            Promise.all(liveAndUpcomingStatuses.map(liveOrUpcomingStatus => {
                return FantasyTeamModel.findByIdAndUpdate(liveOrUpcomingStatus._id.toString(), {
                    matchStatus: "Finished",
                    totalFantasyPoints: idToToTotalPoints[liveOrUpcomingStatus._id],
                    winningAmount: idToPrize[liveOrUpcomingStatus._id] || 0
                })
            }));
        } catch (error) {
            console.log(" FantasyTeams.js:230 ~ FantasyTeams ~ #winnersHandler ~ error:", error);
            return
        }
    }

    #totalFantasyPointsHandler(players, playerToPoints) {
        return players.reduce((acc, id) => {
            return acc + (playerToPoints[id] || 0);
        }, 0)
    }
}

export default new FantasyTeams();