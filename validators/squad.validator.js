import Joi from "joi";

const squadSchema = Joi.object({
    ids: Joi.string()
        .pattern(/^\d+,\d+$/)
        .required()
        .messages({
            'string.pattern.base': `"ids" must be two comma-separated numbers`
        }),
    leagueId: Joi.number().required()
});

export {
    squadSchema
}
