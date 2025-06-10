import Joi from "joi";

const withdrawSchema = Joi.object({
    accountNumber: Joi.string()
        .pattern(/^[0-9]{9,18}$/)
        .required(),

    ifscCode: Joi.string()
        .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
        .uppercase()
        .required(),

    amount: Joi.number()
        .positive()
        .precision(2)
        .min(1)
        .max(1000000)
        .required(),

    bankName: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .required(),

    accountHolderName: Joi.string()
        .pattern(/^[a-zA-Z\s.'-]+$/)
        .min(2)
        .max(100)
        .trim()
        .required()
})

export {
    withdrawSchema
}