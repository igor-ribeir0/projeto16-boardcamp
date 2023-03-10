import { connection } from "../config/dataBase.js";

export async function customersList(req, res){
    try{
        const customersList = await connection.query("SELECT * FROM customers");

        res.status(200).send(customersList.rows);
    }
    catch(error){
        res.status(500).send(error.message);
    }
};

export async function customerById(req, res){
    const { id } = req.params;

    try{
        const findCustomer = await connection.query(`SELECT * FROM customers WHERE id = $1`, [id]);

        if(findCustomer.rows.length === 0) return res.sendStatus(404);

        res.status(200).send(findCustomer.rows[0]);
    }
    catch(error){
        res.status(500).send(error.message);
    }
};

export async function newCustomer(req, res){
    const { name, phone, cpf, birthday } = req.body;

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
};

export async function customerUpdate(req, res){
    const { id } = req.params;
    const { name, phone, cpf, birthday } = req.body;

    try{
        const customerCpf = await connection.query(
            `
                SELECT * FROM customers WHERE cpf = $1 AND id <> $2
            `,
            [cpf, id]
        );

        if(customerCpf.rows.length > 0) return res.sendStatus(409);

        await connection.query(
			"UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5",
			[name, phone, cpf, birthday, id]
		);

        res.sendStatus(200);
    }
    catch(error){
        res.status(500).send(error.message);
    }
};