import joi from "joi";

export const rentalSchema = joi.object(
    {
        customerId: joi.number().positive().greater(0).required(),
        gameId: joi.number().positive().greater(0).required(),
        daysRented: joi.number().positive().greater(0).required()  
    }
);