import joi from "joi";

export const customerSchema = joi.object(
    {
        name: joi.string().required(),
        phone: joi.string().min(11).max(12).regex(/^\d+$/).required(),
        cpf: joi.string().length(11).regex(/^\d+$/).required(), 
        birthday: joi.date().format("YYYY-MM-DD").required()
    }
);