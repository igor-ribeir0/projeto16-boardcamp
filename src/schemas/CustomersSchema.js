import joi from "joi";

export const customerSchema = joi.object(
    {
        name: joi.string().required(),
        phone: joi.string().min(10).max(11).regex(/^\d+$/).required(),
        cpf: joi.string().length(11).regex(/^\d+$/).required(), 
        birthday: joi.date().max('2023-12-31').required()
    }
);