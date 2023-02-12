import { connection } from "../config/dataBase.js";
import { customerSchema } from "../schemas/CustomersSchema.js";

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
};

export async function customerUpdate(req, res){
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
};