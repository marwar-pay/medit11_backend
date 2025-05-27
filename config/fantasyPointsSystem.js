export default
    [
        {
            "type": "batting",
            "points": {
                "run": 1,
                "boundary_bonus": 4,
                "six_bonus": 6,
                "bonus_25_runs": 4,
                "bonus_50_runs": 8,
                "bonus_75_runs": 12,
                "bonus_100_runs": 16,
                "duck_penalty": -2
            }
        },
        {
            "type": "bowling",
            "points": {
                "dot_ball": 1,
                "wicket": 30,
                "lbw_bowled_bonus": 8,
                "three_wicket_bonus": 4,
                "four_wicket_bonus": 8,
                "five_wicket_bonus": 12,
                "maiden_over": 12
            }
        },
        {
            "type": "fielding",
            "points": {
                "catch": 8,
                "three_catch_bonus": 4,
                "stumping": 12,
                "run_out_direct_hit": 12,
                "run_out_indirect_hit": 6
            }
        },
        {
            "type": "economyRate",
            "min_overs": 2,
            "points": {
                "below_5": 6,
                "5_to_5.99": 4,
                "6_to_7": 2,
                "10_to_11": -2,
                "11.01_to_12": -4,
                "above_12": -6
            }
        },
        {
            "type": "strickRate",
            "min_balls": 10,
            "points": {
                "above_170": 6,
                "150.01_to_170": 4,
                "130_to_150": 2,
                "60_to_70": -2,
                "50_to_59.99": -4,
                "below_50": -6
            }
        }
    ]