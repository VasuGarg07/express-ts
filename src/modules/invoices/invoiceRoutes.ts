import { Router } from "express";
import { validate } from "../../middlewares/validationMiddleware";
import InvoiceSchema from "./invoiceValidator";
import { generateInvoice } from "./invoiceController";

const router = Router();

router.post('/generate', validate(InvoiceSchema), generateInvoice)

export default router;