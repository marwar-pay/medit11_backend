import Joi from "joi";
import mongoose from "mongoose";

const editFantasyTeamSchema = Joi.object({
    players: Joi.array().items(Joi.number()).length(11).required(),
    contestPrize: Joi.number().required()
});

const fantasyTeamSchema = editFantasyTeamSchema.keys({
    matchId: Joi.number().required(),
    seasonId: Joi.number().required()
});

const paramsSchema = Joi.object({
    id: Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error('any.invalid');
        }
        return value;
    }, 'ObjectId Validation').required().label('ID'),
});

export {
    fantasyTeamSchema,
    paramsSchema,
    editFantasyTeamSchema
}