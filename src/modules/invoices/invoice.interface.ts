export interface BillingInfo {
    name: string;
    email: string;
    address: string;
}

export interface InvoiceItem {
    name: string;
    description: string;
    quantity: number;
    price: number;
}

export interface Invoice {
    currentDate: string;
    dueDate: string;
    invoiceNumber: string;
    currency: string;
    currencySymbol: string;
    billTo: BillingInfo;
    billFrom: BillingInfo;
    items: InvoiceItem[];
    taxRate: number;
    discountRate: number;
    notes: string;
}