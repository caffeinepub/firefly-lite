import { InvoiceStatus } from '../../types/invoice';

export interface InvoiceFilterState {
  status?: InvoiceStatus;
  customerId?: bigint;
  startDate?: Date;
  endDate?: Date;
}

export function getStatusLabel(status: InvoiceStatus): string {
  if (status.__kind__ === 'Draft') return 'Draft';
  if (status.__kind__ === 'Sent') return 'Sent';
  if (status.__kind__ === 'Paid') return 'Paid';
  if (status.__kind__ === 'Overdue') return 'Overdue';
  return 'Unknown';
}

export function getStatusVariant(status: InvoiceStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status.__kind__ === 'Draft') return 'secondary';
  if (status.__kind__ === 'Sent') return 'default';
  if (status.__kind__ === 'Paid') return 'outline';
  if (status.__kind__ === 'Overdue') return 'destructive';
  return 'default';
}

export function createInvoiceStatus(kind: 'Draft' | 'Sent' | 'Paid' | 'Overdue'): InvoiceStatus {
  return { __kind__: kind, [kind]: null } as InvoiceStatus;
}
