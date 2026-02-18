import { useNavigate, useParams } from '@tanstack/react-router';
import { useGetInvoice } from '../hooks/useFinanceQueries';
import { useInvoicePermissions } from '../hooks/useInvoicePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Pencil, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/format';
import { getStatusLabel, getStatusVariant } from './invoices/invoiceFilters';
import { generateInvoicePdf } from '../utils/invoicePdf';
import { toast } from 'sonner';

export default function InvoiceDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const invoiceId = params.invoiceId ? BigInt(params.invoiceId) : null;

  const permissions = useInvoicePermissions();
  const { data: invoice, isLoading } = useGetInvoice(invoiceId || BigInt(0));

  const handleDownloadPdf = () => {
    if (!invoice) return;
    try {
      generateInvoicePdf(invoice);
      toast.success('Invoice downloaded');
    } catch (error: any) {
      toast.error('Failed to download invoice');
    }
  };

  if (permissions.isLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!permissions.canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You do not have permission to view invoices.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Not Found</CardTitle>
          <CardDescription>The requested invoice could not be found.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate({ to: '/invoices' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isPaid = invoice.status.__kind__ === 'Paid';
  const isDraft = invoice.status.__kind__ === 'Draft';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/invoices' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground mt-1">
              <Badge variant={getStatusVariant(invoice.status)} className="mt-2">
                {getStatusLabel(invoice.status)}
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {permissions.canEdit && (
            <Button
              variant="outline"
              onClick={() => navigate({ to: `/invoices/${invoice.id}/edit` })}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-medium">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{invoice.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issue Date</p>
              <p className="font-medium">{formatDate(Number(invoice.issueDate))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{formatDate(Number(invoice.dueDate))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={getStatusVariant(invoice.status)}>
                {getStatusLabel(invoice.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">{formatCurrency(invoice.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id.toString()}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
