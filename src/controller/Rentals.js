import dayjs from "dayjs";
import { connection } from "../config/dataBase.js";

export async function rentalsList(req, res){
    try{
        const rentalList = await connection.query(
            `
            SELECT
            rentals.*,
            json_build_object('id', customers.id, 'name', customers.name) AS customer,
            json_build_object('id', games.id, 'name', games.name) AS game
            FROM
            rentals
            JOIN customers 
                ON rentals."customerId" = customers.id
            JOIN games 
                ON rentals."gameId" = games.id;
            `
        );

        res.status(200).send(rentalList.rows);
    }
    catch(error){
        res.status(500).send(error.message);
    }
};

export async function newRental(req, res){
    const { customerId, gameId, daysRented } = req.body;

    try{
        const searchCustomer = await connection.query(`SELECT * FROM customers WHERE id = $1`, [customerId]);
        const searchGame = await connection.query(`SELECT * FROM games WHERE id = $1`, [gameId]);
        const rentalList = await connection.query(`SELECT * FROM rentals WHERE "gameId" = $1`, [gameId]);

        if(searchCustomer.rows.length === 0 || searchGame.rows.length === 0){
            return res.sendStatus(400);
        };

        if(rentalList.rows.length >= Number(searchGame.rows[0].stockTotal)){
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
                daysRented * Number(searchGame.rows[0].pricePerDay),
                null
            ]
        );

        res.sendStatus(201);
    }
    catch(error){
        res.status(500).send(error.message);
    }
};

export async function rentalReturn(req, res){
    const { id } = req.params;

    try{
        const searchRental = await connection.query(
            `
                SELECT * FROM rentals WHERE id = $1
            `,
            [id]
        );

        if(searchRental.rows.length === 0) return res.sendStatus(404);

        if(searchRental.rows[0].returnDate !== null) return res.sendStatus(400);

        const ms = new Date().getTime() - new Date(searchRental.rows[0].rentDate).getTime();
        const msToDays = Math.floor(ms / 86400000);
        let latePayment = 0;

        if (msToDays > searchRental.rows[0].daysRented) {
            const addicionalDays = msToDays - searchRental.rows[0].daysRented;
            latePayment = addicionalDays * (searchRental.rows[0].originalPrice / searchRental.rows[0].daysRented);
        };

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
};

export async function deleteRental(req, res){
    const { id } = req.params;

    try{
        const searchRental = await connection.query(
            `
                SELECT * FROM rentals WHERE id = $1
            `,
            [id]
        );

        if(searchRental.rows.length === 0) return res.sendStatus(404);

        if(searchRental.rows[0].returnDate === null) return res.sendStatus(400);

        await connection.query(
            `
                DELETE FROM rentals WHERE id = $1
            `,
            [id]
        );

        res.sendStatus(200);
    }
    catch(error){
        res.status(500).send(error.message);
    }
};