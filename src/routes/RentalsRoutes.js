import { rentalsList, newRental, rentalReturn, deleteRental } from "../controller/Rentals.js";
import { Router } from "express";
import { validateSchema } from "../middleware/validateSchema.js";
import { rentalSchema } from "../schemas/RentalsSchema.js";

const rentalsRouter = Router();

rentalsRouter.get("/rentals", rentalsList);
rentalsRouter.post("/rentals", validateSchema(rentalSchema), newRental);
rentalsRouter.post("/rentals/:id/return", rentalReturn);
rentalsRouter.delete("/rentals/:id", deleteRental);

export default rentalsRouter;