import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const app = express();
app.use(express.json());
app.use(cors());
app.listen(process.env.PORT);

const connection = new Pool({
    connectionString: process.env.DATABASE_URL,
});

if(process.env.MODE === "prod"){
    connection.ssl = true;
};

const newGameSchema = joi.object(
    {
        name: joi.string().required(),
        image: joi.string().uri().required(),
        stockTotal: joi.number().positive().greater(0).required(),
        pricePerDay: joi.number().positive().greater(0).required()
    }
);

const customerSchema = joi.object(
    {
        name: joi.string().required(),
        phone: joi.string().min(10).max(11).required(),
        cpf: joi.string().min(11).max(11).required(), 
        birthday: joi.date().max('2023-12-31').required()
    }
);

const rentalSchema = joi.object(
    {
        customerId: joi.number().positive().greater(0).required(),
        gameId: joi.number().positive().greater(0).required(),
        daysRented: joi.number().positive().greater(0).required()  
    }
)

app.get("/games", async(req, res) => {
    try{
        const gameList = await connection.query("SELECT * FROM games");
        return res.status(200).send(gameList.rows);
    }
    catch(error){
        return res.status(500).send(error.message);
    }
});

app.get("/customers", async(req, res) => {
    const customersList = await connection.query("SELECT * FROM customers");

    res.status(200).send(customersList.rows);
});

app.get("/customers/:id", async(req, res) => {
    const { id } = req.params;

    try{
        const findCustomer = await connection.query(`SELECT * FROM customers WHERE id = $1`, [id]);

        if(findCustomer.rows.length === 0) return res.sendStatus(404);

        res.status(200).send(findCustomer.rows[0]);
    }
    catch(error){
        res.status(500).send(error.message);
    }
});

app.get("/rentals", async(req, res) => {
    try{
        const rentalList = await connection.query(
            `
                SELECT json_build_object(
                    'id', rentals.id,
                    'customerId', rentals."customerId",
                    'gameId', rentals."gameId",
                    'rentDate', rentals."rentDate",
                    'daysRented', rentals."daysRented",
                    'returnDate', rentals."returnDate",
                    'originalPrice', rentals."originalPrice",
                    'delayFee', rentals."delayFee",
                    'customer', json_build_object(
                        'id', customers.id,
                        'name', customers.name
                    ),
                    'game', json_build_object(
                        'id', games.id,
                        'name', games.name
                    )
                )
                FROM rentals
                JOIN customers
                    ON rentals."customerId" = customers.id
                JOIN games
                    ON rentals."gameId" = games.id
            `
        );

        res.status(200).send(rentalList.rows);
    }
    catch(error){
        res.status(500).send(error.message);
    }
});

app.post("/games", async(req, res) => {
    const { name, image, stockTotal, pricePerDay } = req.body;
    const newGame = { name, image, stockTotal, pricePerDay };
    const validation = newGameSchema.validate(newGame, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(400).send(errors);
    };

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
});

app.post("/customers", async(req, res) => {
    const { name, phone, cpf, birthday } = req.body;

    const newCustomer = { name, phone, cpf, birthday };

    const validation = customerSchema.validate(newCustomer, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(400).send(errors);
    };

    try{
        const customerCpf = await connection.query(`SELECT * FROM customers WHERE cpf = $1`, [cpf]);

        if(customerCpf.rows.length !== 0) return res.sendStatus(409);

        await connection.query(`INSERT INTO customers (name, phone, cpf, birthday) 
            VALUES ($1, $2, $3, $4)`, [name, phone, cpf, birthday]
        );

        res.sendStatus(201);
    }
    catch(error){
        res.status(500).send(error.message);
    }
});

app.post("/rentals", async(req, res) => {
    const { customerId, gameId, daysRented } = req.body;
    const newRental = { customerId, gameId, daysRented };
    const validation = rentalSchema.validate(newRental, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(400).send(errors);
    };

    try{
        const searchCustomer = await connection.query(`SELECT * FROM customers WHERE id = $1`, [customerId]);
        const searchGame = await connection.query(`SELECT * FROM games WHERE id = $1`, [gameId]);
        const rentalList = await connection.query(`SELECT * FROM rentals WHERE "gameId" = $1`, [gameId]);

        if(searchCustomer.rows.length === 0 || searchGame.rows.length === 0){
            return res.sendStatus(400);
        };

        if(rentalList.rows.length > searchGame.rows[0].stockTotal){
            return res.sendStatus(400);
        };

        await connection.query(
            `
                INSERT INTO 
                rentals 
                (
                    "customerId",
                    "gameId",
                    "rentDate",
                    "daysRented", 
                    "returnDate",
                    "originalPrice",
                    "delayFee"
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                
            `,
            [
                customerId, 
                gameId, 
                dayjs().format("YYYY-MM-DD"), 
                daysRented,
                null,
                daysRented * Number(searchGame.rows[0].pricePerDay) * 100,
                null
            ]
        );

        res.sendStatus(201);
    }
    catch(error){
        res.status(500).send(error.message);
    }
});

app.post("/rentals/:id/return", async(req, res) => {
    const { id } = req.params;
    const todayDate = dayjs().format("YYYY-MM-DD");

    try{
        const searchRental = await connection.query(
            `
                SELECT * FROM rentals WHERE id = $1
            `,
            [id]
        );

        const searchGame = await connection.query(
            `
                SELECT * FROM games WHERE id = $1
            `,
            [searchRental.rows[0].gameId]
        );

        const gamePrice = searchGame.rows[0].pricePerDay;
        const delay = dayjs(searchRental.rows[0].rentDate).diff(todayDate, 'day');
        const latePayment = Number(delay) * gamePrice * 100;

        if(searchRental.rows.length === 0) return res.sendStatus(404);

        if(searchRental.rows[0].returnDate !== null) return res.sendStatus(400);

        await connection.query(
            `
                UPDATE rentals
                SET "returnDate" = $1
                WHERE id = $2
            `,
            [dayjs().format("YYYY-MM-DD"), id]
        );

        await connection.query(
            `
                UPDATE rentals
                SET "delayFee" = $1
                WHERE id = $2
            `,
            [latePayment, id]
        );

        res.sendStatus(200);
    }
    catch(error){
        res.status(500).send(error.message);
    }
});

app.put("/customers/:id", async(req, res) => {
    const { id } = req.params;
    const { name, phone, cpf, birthday } = req.body;
    const customer = { name, phone, cpf, birthday };

    const validation = customerSchema.validate(customer, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(400).send(errors);
    };

    try{
        const customerId = await connection.query("SELECT * FROM customers WHERE id = $1", [id]);
        const customerCpf = await connection.query("SELECT * FROM customers WHERE cpf = $1", [cpf]);

        if(customerId.rows.length === 0 || customerCpf.rows.length === 0){
            return res.sendStatus(404);
        };

        await connection.query("UPDATE customers SET name = $1 WHERE id = $2", [name, id]);
        await connection.query("UPDATE customers SET phone = $1 WHERE id = $2", [phone, id]);
        await connection.query("UPDATE customers SET birthday = $1 WHERE id = $2", [birthday, id]);

        res.sendStatus(200);
    }
    catch(error){
        res.status(500).send(error.message);
    }
});