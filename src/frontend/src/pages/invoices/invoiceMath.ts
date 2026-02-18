export interface InvoiceLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export function calculateLineItemTotal(item: InvoiceLineItem): number {
  return item.quantity * item.unitPrice;
}

export function calculateSubtotal(items: InvoiceLineItem[]): number {
  return items.reduce((sum, item) => sum + calculateLineItemTotal(item), 0);
}

export function calculateTax(subtotal: number, taxRate: number = 0.1): number {
  return subtotal * taxRate;
}

export function calculateTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}

export function calculateInvoiceTotals(items: InvoiceLineItem[], taxRate: number = 0.1) {
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(subtotal, taxRate);
  const total = calculateTotal(subtotal, tax);
  
  return { subtotal, tax, total };
}
