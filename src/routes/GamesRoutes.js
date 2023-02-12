import { gameList, newGame } from "../controller/Games.js";
import { Router } from "express";
import { validateSchema } from "../middleware/validateSchema.js";
import { newGameSchema } from "../schemas/GamesSchema.js";

const gamesRouter = Router();

gamesRouter.get("/games", gameList);
gamesRouter.post("/games", validateSchema(newGameSchema), newGame);

export default gamesRouter;