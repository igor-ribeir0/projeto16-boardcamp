import joi from "joi";

export const newGameSchema = joi.object(
    {
        name: joi.string().required(),
        image: joi.string().uri().required(),
        stockTotal: joi.number().positive().greater(0).required(),
        pricePerDay: joi.number().positive().greater(0).required()
    }
);