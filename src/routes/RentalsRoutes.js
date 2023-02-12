import { rentalsList, newRental, rentalReturn, deleteRental } from "../controller/Rentals.js";
import { Router } from "express";

const rentalsRouter = Router();

rentalsRouter.get("/rentals", rentalsList);
rentalsRouter.post("/rentals", newRental);
rentalsRouter.post("/rentals/:id/return", rentalReturn);
rentalsRouter.delete("/rentals/:id", deleteRental);

export default rentalsRouter;