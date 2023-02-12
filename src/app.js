import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import gamesRouter from "./routes/GamesRoutes.js";
import customersRouter from "./routes/CustomersRoutes.js";
import rentalsRouter from "./routes/RentalsRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use([gamesRouter, customersRouter, rentalsRouter]);

app.listen(process.env.PORT);