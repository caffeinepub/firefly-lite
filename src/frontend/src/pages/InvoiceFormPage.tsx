import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useGetInvoice, useCreateInvoice, useUpdateInvoice } from '../hooks/useFinanceQueries';
import { useInvoicePermissions } from '../hooks/useInvoicePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { calculateLineItemTotal, calculateSubtotal, calculateTax, calculateTotal } from './invoices/invoiceMath';
import { toast } from 'sonner';
import type { CreateInvoiceInput, UpdateInvoiceInput } from '../types/invoice';

interface LineItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const invoiceId = params.invoiceId ? BigInt(params.invoiceId) : null;
  const isEditMode = !!invoiceId;

  const permissions = useInvoicePermissions();
  const { data: existingInvoice, isLoading: loadingInvoice } = useGetInvoice(invoiceId || BigInt(0));
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();

  const [customerName, setCustomerName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { name: '', quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    if (existingInvoice && isEditMode) {
      setCustomerName(existingInvoice.customerName);
      setIssueDate(new Date(Number(existingInvoice.issueDate)).toISOString().split('T')[0]);
      setDueDate(new Date(Number(existingInvoice.dueDate)).toISOString().split('T')[0]);
      setNotes(existingInvoice.notes);
      setLineItems(
        existingInvoice.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      );
    }
  }, [existingInvoice, isEditMode]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { name: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const subtotal = calculateSubtotal(lineItems);
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !issueDate || !dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (lineItems.some((item) => !item.name || item.quantity <= 0 || item.unitPrice < 0)) {
      toast.error('Please complete all line items');
      return;
    }

    try {
      if (isEditMode && invoiceId) {
        const input: UpdateInvoiceInput = {
          invoiceId,
          customerId: BigInt(0),
          customerName,
          issueDate: BigInt(new Date(issueDate).getTime()),
          dueDate: BigInt(new Date(dueDate).getTime()),
          status: { __kind__: 'Draft', Draft: null },
          notes,
          items: lineItems,
        };
        await updateInvoiceMutation.mutateAsync(input);
        toast.success('Invoice updated successfully');
        navigate({ to: `/invoices/${invoiceId}` });
      } else {
        const input: CreateInvoiceInput = {
          customerId: BigInt(0),
          customerName,
          issueDate: BigInt(new Date(issueDate).getTime()),
          dueDate: BigInt(new Date(dueDate).getTime()),
          status: { __kind__: 'Draft', Draft: null },
          notes,
          items: lineItems,
        };
        await createInvoiceMutation.mutateAsync(input);
        toast.success('Invoice created successfully');
        navigate({ to: '/invoices' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save invoice');
    }
  };

  if (permissions.isLoading || (isEditMode && loadingInvoice)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if ((isEditMode && !permissions.canEdit) || (!isEditMode && !permissions.canCreate)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to {isEditMode ? 'edit' : 'create'} invoices.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isEditMode && !existingInvoice) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/invoices' })}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Invoice' : 'Create Invoice'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Enter the basic information for this invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or terms..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Add items or services to this invoice</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="w-24">Quantity</TableHead>
                  <TableHead className="w-32">Unit Price</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.name}
                        onChange={(e) => handleLineItemChange(index, 'name', e.target.value)}
                        placeholder="Item name"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(calculateLineItemTotal(item))}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLineItem(index)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/invoices' })}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {createInvoiceMutation.isPending || updateInvoiceMutation.isPending
              ? 'Saving...'
              : isEditMode
              ? 'Update Invoice'
              : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}
