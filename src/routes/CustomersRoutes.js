import { customersList, customerById, newCustomer, customerUpdate  } from "../controller/Customers.js";
import { Router } from "express";

const customersRouter = Router();

customersRouter.get("/customers", customersList);
customersRouter.get("/customers/:id", customerById);
customersRouter.post("/customers", newCustomer);
customersRouter.put("/customers/:id", customerUpdate);

export default customersRouter;