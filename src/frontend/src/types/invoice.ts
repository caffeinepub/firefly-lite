// Invoice types for frontend use (backend implementation pending)
export type InvoiceId = bigint;
export type CustomerId = bigint;
export type JobId = bigint;
export type EstimateId = bigint;
export type InvoiceItemId = bigint;

export type InvoiceStatus = {
    __kind__: "Draft";
    Draft: null;
} | {
    __kind__: "Sent";
    Sent: null;
} | {
    __kind__: "Paid";
    Paid: null;
} | {
    __kind__: "Overdue";
    Overdue: null;
};

export interface InvoiceItem {
    id: InvoiceItemId;
    invoiceId: InvoiceId;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Invoice {
    id: InvoiceId;
    invoiceNumber: string;
    customerId: CustomerId;
    customerName: string;
    jobId?: JobId;
    estimateId?: EstimateId;
    issueDate: bigint;
    dueDate: bigint;
    status: InvoiceStatus;
    subtotal: number;
    tax: number;
    total: number;
    notes: string;
    items: Array<InvoiceItem>;
    createdAt: bigint;
    updatedAt: bigint;
}

export interface CreateInvoiceInput {
    customerId: CustomerId;
    customerName: string;
    jobId?: JobId;
    estimateId?: EstimateId;
    issueDate: bigint;
    dueDate: bigint;
    status: InvoiceStatus;
    notes: string;
    items: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
    }>;
}

export interface UpdateInvoiceInput {
    invoiceId: InvoiceId;
    customerId: CustomerId;
    customerName: string;
    jobId?: JobId;
    estimateId?: EstimateId;
    issueDate: bigint;
    dueDate: bigint;
    status: InvoiceStatus;
    notes: string;
    items: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
    }>;
}

export interface InvoiceFilters {
    status?: InvoiceStatus;
    customerId?: CustomerId;
    startDate?: bigint;
    endDate?: bigint;
}
