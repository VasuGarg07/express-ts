import { NextFunction, Request, Response } from 'express';
import * as invoiceService from './invoiceService';
import { Invoice } from './invoice.interface';

export const generateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice: Invoice = req.body;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`
    );

    const doc = invoiceService.buildInvoicePdf(invoice);
    doc.pipe(res);
  } catch (error) {
    next(error);
  }
};