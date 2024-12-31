import { NextFunction, Request, Response } from "express";
import PDFDocument from "pdfkit
import { Invoice } from "../models/invoiceModel";

export const generateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoice: Invoice = req.body;

        // Create a new PDF document
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

        // Pipe the PDF to the response
        doc.pipe(res);

        // Helper function for consistent spacing
        const addLineBreak = (height = 20) => {
            doc.moveDown(height / doc.currentLineHeight());
        };

        // Title
        doc.font('Helvetica-Bold').fontSize(24).text('Invoice', { align: 'left' });
        addLineBreak();

        // Header information
        doc.font('Helvetica').fontSize(10);
        doc.text(`Date: ${invoice.currentDate}`, 50, doc.y);
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 400, doc.y - 12);
        addLineBreak(10);
        doc.text(`Due: ${invoice.dueDate}`, 50, doc.y);
        doc.text(`Currency: ${invoice.currency}`, 400, doc.y - 12);
        addLineBreak(30);

        // Billing information
        doc.font('Helvetica-Bold').fontSize(12);
        const billingY = doc.y;

        // Bill To
        doc.text('Bill To:', 50, billingY);
        doc.font('Helvetica').fontSize(10);
        addLineBreak(20);
        doc.text(invoice.billTo.name, 50, billingY + 20);
        doc.text(invoice.billTo.email, 50, billingY + 35);
        doc.text(invoice.billTo.address, 50, billingY + 50);

        // Bill From
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Bill From:', 400, billingY);
        doc.font('Helvetica').fontSize(10);
        doc.text(invoice.billFrom.name, 400, billingY + 20);
        doc.text(invoice.billFrom.email, 400, billingY + 35);
        doc.text(invoice.billFrom.address, 400, billingY + 50);

        // Move to position after billing info
        doc.y = billingY + 90;
        addLineBreak(20);

        // Items table
        const tableTop = doc.y;
        const tableHeaders = ['Item', 'Description', 'Qty', 'Price', 'Total'];
        const colWidths = [100, 180, 60, 80, 80];

        // Draw table header background
        doc.rect(50, tableTop, 500, 20).fill('#f5f5f5');
        doc.fillColor('black');

        // Draw table headers
        let xPosition = 50;
        doc.font('Helvetica-Bold').fontSize(10)
        tableHeaders.forEach((header, i) => {
            const align = i >= 2 ? 'right' : 'left';
            const padding = align === 'right' ? -5 : 5;
            doc.text(header, xPosition + padding, tableTop + 5, {
                width: colWidths[i],
                align: align
            });
            xPosition += colWidths[i];
        });

        // Draw table rows
        let yPosition = tableTop + 25;
        doc.font('Helvetica').fontSize(10);
        invoice.items.forEach((item, index) => {
            xPosition = 50;
            const line = [
                item.name,
                item.description,
                item.quantity.toString(),
                `${invoice.currencySymbol}${item.price.toFixed(2)}`,
                `${invoice.currencySymbol}${(item.quantity * item.price).toFixed(2)}`
            ];

            // Draw row background for even rows
            if (index % 2 === 1) {
                doc.rect(50, yPosition - 5, 500, 20).fill('#f9f9f9');
                doc.fillColor('black');
            }

            line.forEach((text, i) => {
                const align = i >= 2 ? 'right' : 'left';
                const padding = align === 'right' ? -5 : 5;
                doc.text(text, xPosition + padding, yPosition, {
                    width: colWidths[i],
                    align: align
                });
                xPosition += colWidths[i];
            });
            yPosition += 20;
        });

        // Calculate totals
        const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const taxAmount = subtotal * (invoice.taxRate / 100);
        const discountAmount = subtotal * (invoice.discountRate / 100);
        const total = subtotal + taxAmount - discountAmount;

        // Add totals section
        doc.y = yPosition + 20;
        const totalsX = 380;
        const totalsWidth = 120;

        const formatAmount = (amount: number) => `${invoice.currencySymbol}${amount.toFixed(2)}`;

        // Draw totals
        doc.font('Helvetica').fontSize(10);
        doc.text('Subtotal:', totalsX, doc.y, { width: totalsWidth, align: 'right' });
        doc.text(formatAmount(subtotal), totalsX + totalsWidth, doc.y - 12, { align: 'right' });
        addLineBreak(15);

        doc.text(`Tax (${invoice.taxRate}%):`, totalsX, doc.y, { width: totalsWidth, align: 'right' });
        doc.text(formatAmount(taxAmount), totalsX + totalsWidth, doc.y - 12, { align: 'right' });
        addLineBreak(15);

        doc.text(`Discount (${invoice.discountRate}%):`, totalsX, doc.y, { width: totalsWidth, align: 'right' });
        doc.text(formatAmount(discountAmount), totalsX + totalsWidth, doc.y - 12, { align: 'right' });
        addLineBreak(15);

        // Draw line before total
        doc.moveTo(totalsX, doc.y).lineTo(totalsX + totalsWidth + 50, doc.y).stroke();
        addLineBreak(15);

        // Total
        doc.font('Helvetica-Bold');
        doc.text('Total:', totalsX, doc.y, { width: totalsWidth, align: 'right' });
        doc.text(formatAmount(total), totalsX + totalsWidth, doc.y - 12, { align: 'right' });
        addLineBreak(30);

        // Notes section
        if (invoice.notes) {
            doc.font('Helvetica-Bold').fontSize(12).text('Notes:', 50, doc.y);
            addLineBreak(15);
            doc.font('Helvetica').fontSize(10).text(invoice.notes, 50, doc.y);
        }

        // Finalize the PDF
        doc.end();

    } catch (error) {
        next(error);
    }
};