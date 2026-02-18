import { Invoice } from '../types/invoice';
import { formatCurrency, formatDate } from '../lib/format';
import { getStatusLabel } from '../pages/invoices/invoiceFilters';

export function generateInvoicePdf(invoice: Invoice) {
  // Create a printable HTML representation
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .invoice-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .info-section {
          flex: 1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .totals {
          margin-left: auto;
          width: 300px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        .totals-row.total {
          font-weight: bold;
          font-size: 1.2em;
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
        }
        .notes {
          margin-top: 30px;
          padding: 15px;
          background-color: #f9f9f9;
          border-left: 3px solid #333;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>INVOICE</h1>
        <p>Invoice Number: ${invoice.invoiceNumber}</p>
      </div>
      
      <div class="invoice-info">
        <div class="info-section">
          <h3>Bill To:</h3>
          <p><strong>${invoice.customerName}</strong></p>
        </div>
        <div class="info-section">
          <p><strong>Issue Date:</strong> ${formatDate(Number(invoice.issueDate))}</p>
          <p><strong>Due Date:</strong> ${formatDate(Number(invoice.dueDate))}</p>
          <p><strong>Status:</strong> ${getStatusLabel(invoice.status)}</p>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${formatCurrency(item.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>Tax:</span>
          <span>${formatCurrency(invoice.tax)}</span>
        </div>
        <div class="totals-row total">
          <span>Total:</span>
          <span>${formatCurrency(invoice.total)}</span>
        </div>
      </div>
      
      ${invoice.notes ? `
        <div class="notes">
          <h3>Notes:</h3>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}
    </body>
    </html>
  `;

  // Create a blob and trigger download
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${invoice.invoiceNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
