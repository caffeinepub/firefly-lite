import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetInvoices, useDeleteInvoice } from '../hooks/useFinanceQueries';
import { useInvoicePermissions } from '../hooks/useInvoicePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Eye, Pencil, Trash2, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/format';
import { getStatusLabel, getStatusVariant, createInvoiceStatus } from './invoices/invoiceFilters';
import { toast } from 'sonner';
import type { Invoice } from '../types/invoice';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const permissions = useInvoicePermissions();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading } = useGetInvoices();
  const deleteMutation = useDeleteInvoice();

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesStatus = statusFilter === 'all' || invoice.status.__kind__ === statusFilter;
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [invoices, statusFilter, searchQuery]);

  const handleDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      await deleteMutation.mutateAsync(invoiceToDelete.id);
      toast.success('Invoice deleted successfully');
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete invoice');
    }
  };

  const openDeleteDialog = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  if (permissions.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading permissions...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="h-8 w-8" />
            Invoices
          </h1>
          <p className="text-muted-foreground mt-1">Manage your invoices and billing</p>
        </div>
        {permissions.canCreate && (
          <Button onClick={() => navigate({ to: '/invoices/new' })} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by invoice number or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {invoices.length === 0 ? 'No invoices yet. Create your first invoice to get started.' : 'No invoices match your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id.toString()}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(invoice.status)}>
                          {getStatusLabel(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>{formatDate(Number(invoice.dueDate))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate({ to: `/invoices/${invoice.id}` })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {permissions.canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate({ to: `/invoices/${invoice.id}/edit` })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(invoice)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {invoiceToDelete?.invoiceNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
