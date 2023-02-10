import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import joi from "joi";
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

app.post("/games", async(req, res) => {
    const { name, image, stockTotal, pricePerDay } = req.body;
    const newGame = { name, image, stockTotal, pricePerDay };
    const validation = newGameSchema.validate(newGame, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(400).send(errors);
    };

    try{
        const gameName = await connection.query(`SELECT * FROM games WHERE name = ${name}`);

        if(gameName){
            return res.sendStatus(409);
        };

        await connection.query(`INSERT INTO games (name, image, "stockTotal", "pricePerDay") VALUES ('$1', '$2', '$3', '$4')`, [name, image, stockTotal, pricePerDay]);

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