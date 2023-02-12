import { customersList, customerById, newCustomer, customerUpdate  } from "../controller/Customers.js";
import { Router } from "express";
import { validateSchema } from "../middleware/validateSchema.js";
import { customerSchema } from "../schemas/CustomersSchema.js";

const customersRouter = Router();

customersRouter.get("/customers", customersList);
customersRouter.get("/customers/:id", customerById);
customersRouter.post("/customers", validateSchema(customerSchema), newCustomer);
customersRouter.put("/customers/:id", validateSchema(customerSchema), customerUpdate);

export default customersRouter;