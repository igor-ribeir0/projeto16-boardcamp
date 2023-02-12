import { gameList, newGame } from "../controller/Games.js";
import { Router } from "express";

const gamesRouter = Router();

gamesRouter.get("/games", gameList);
gamesRouter.post("/games", newGame);

export default gamesRouter;