import Joi from "joi";

/**
 * Joi validator middleware
 * @param {'body' | 'query' | 'params'} source - part of req to validate
 * @param {Joi.ObjectSchema} schema - Joi schema to validate against
 */
const validate = (source, schema) => {
    return (req, res, next) => {

        const data = req[source];

        if (data === undefined) {
            return res.status(400).json({
                status: 400,
                message: `Missing request ${source}`,
            });
        }

        const { error } = schema.validate(req[source], { abortEarly: false });
        console.log(req[source]);

        if (error) {
            return res.status(400).json({
                statusCode: 400,
                message: "Validation failed",
                errors: error.details.map((e) => e.message),
            });
        }

        next();
    };
};

export default validate;
