import { Router } from "express";
import { generateInvoice } from "../controllers/invoiceController";
import InvoiceSchema from "../validators/invoiceValidator";
import { validate } from "../middlewares/validationMiddleware";

const router = Router();

router.post('/generate', validate(InvoiceSchema), generateInvoice)

export default router;