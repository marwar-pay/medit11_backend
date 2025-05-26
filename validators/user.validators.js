import Joi from 'joi';

const createUserSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    mobile: Joi.string().min(12).max(13).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

const loginUserSchema = Joi.object({
    id: Joi.string().required(),
    password: Joi.string().min(6).required(),
});

export {
    createUserSchema,
    loginUserSchema
} 