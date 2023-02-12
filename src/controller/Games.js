import { connection } from "../config/dataBase.js";

export async function gameList(req, res){
    try{
        const gameList = await connection.query("SELECT * FROM games");
        return res.status(200).send(gameList.rows);
    }
    catch(error){
        return res.status(500).send(error.message);
    }
};

export async function newGame(req, res){
    const { name, image, stockTotal, pricePerDay } = req.body;

    try{
        const gameName = await connection.query("SELECT * FROM games WHERE name = $1", [name]);

        if(gameName.rows.length !== 0){
            return res.sendStatus(409);
        };

        await connection.query(`
            INSERT INTO games (name, image, "stockTotal", "pricePerDay") 
            VALUES ($1, $2, $3, $4)`, [name, image, stockTotal, pricePerDay]
        );

        return res.sendStatus(201);
    }
    catch(error){
        return res.status(500).send(error.message);
    }
};