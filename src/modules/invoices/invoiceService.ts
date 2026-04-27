import PDFDocument from 'pdfkit';
import { Invoice } from './invoice.interface';

export const buildInvoicePdf = (invoice: Invoice): PDFKit.PDFDocument => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  const addLineBreak = (height = 20) => {
    doc.moveDown(height / doc.currentLineHeight());
  };

  const formatAmount = (amount: number) => `${invoice.currencySymbol}${amount.toFixed(2)}`;

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

  doc.text('Bill To:', 50, billingY);
  doc.font('Helvetica').fontSize(10);
  addLineBreak(20);
  doc.text(invoice.billTo.name, 50, billingY + 20);
  doc.text(invoice.billTo.email, 50, billingY + 35);
  doc.text(invoice.billTo.address, 50, billingY + 50);

  doc.font('Helvetica-Bold').fontSize(12);
  doc.text('Bill From:', 400, billingY);
  doc.font('Helvetica').fontSize(10);
  doc.text(invoice.billFrom.name, 400, billingY + 20);
  doc.text(invoice.billFrom.email, 400, billingY + 35);
  doc.text(invoice.billFrom.address, 400, billingY + 50);

  doc.y = billingY + 90;
  addLineBreak(20);

  // Items table
  const tableTop = doc.y;
  const tableHeaders = ['Item', 'Description', 'Qty', 'Price', 'Total'];
  const colWidths = [100, 180, 60, 80, 80];

  doc.rect(50, tableTop, 500, 20).fill('#f5f5f5');
  doc.fillColor('black');

  let xPosition = 50;
  doc.font('Helvetica-Bold').fontSize(10);
  tableHeaders.forEach((header, i) => {
    const align = i >= 2 ? 'right' : 'left';
    const padding = align === 'right' ? -5 : 5;
    doc.text(header, xPosition + padding, tableTop + 5, {
      width: colWidths[i],
      align,
    });
    xPosition += colWidths[i];
  });

  // Rows
  let yPosition = tableTop + 25;
  doc.font('Helvetica').fontSize(10);
  invoice.items.forEach((item, index) => {
    xPosition = 50;
    const line = [
      item.name,
      item.description,
      item.quantity.toString(),
      formatAmount(item.price),
      formatAmount(item.quantity * item.price),
    ];

    if (index % 2 === 1) {
      doc.rect(50, yPosition - 5, 500, 20).fill('#f9f9f9');
      doc.fillColor('black');
    }

    line.forEach((text, i) => {
      const align = i >= 2 ? 'right' : 'left';
      const padding = align === 'right' ? -5 : 5;
      doc.text(text, xPosition + padding, yPosition, {
        width: colWidths[i],
        align,
      });
      xPosition += colWidths[i];
    });
    yPosition += 20;
  });

  // Totals
  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const taxAmount = subtotal * (invoice.taxRate / 100);
  const discountAmount = subtotal * (invoice.discountRate / 100);
  const total = subtotal + taxAmount - discountAmount;

  doc.y = yPosition + 20;
  const totalsX = 380;
  const totalsWidth = 120;

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

  doc.moveTo(totalsX, doc.y).lineTo(totalsX + totalsWidth + 50, doc.y).stroke();
  addLineBreak(15);

  doc.font('Helvetica-Bold');
  doc.text('Total:', totalsX, doc.y, { width: totalsWidth, align: 'right' });
  doc.text(formatAmount(total), totalsX + totalsWidth, doc.y - 12, { align: 'right' });
  addLineBreak(30);

  // Notes
  if (invoice.notes) {
    doc.font('Helvetica-Bold').fontSize(12).text('Notes:', 50, doc.y);
    addLineBreak(15);
    doc.font('Helvetica').fontSize(10).text(invoice.notes, 50, doc.y);
  }

  doc.end();
  return doc;
};