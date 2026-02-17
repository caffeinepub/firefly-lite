import { useState, useMemo } from 'react';
import { useGetTransactions, useGetAccounts, useGetCategories, useGetTags, useCreateTag } from '../hooks/useFinanceQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Loader2, Search, Download, Upload, Edit } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/format';
import { exportTransactionsToCsv, downloadCsv, type CsvRow } from '../utils/transactionsCsv';
import TransactionFormDialog from '../components/transactions/TransactionFormDialog';
import BulkEditDialog, { type BulkEditAction } from '../components/transactions/BulkEditDialog';
import CsvImportDialog from '../components/transactions/CsvImportDialog';
import TagChips from '../components/tags/TagChips';
import type { TransactionId } from '../backend';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const { data: transactions = [], isLoading } = useGetTransactions();
  const { data: accounts = [] } = useGetAccounts();
  const { data: categories = [] } = useGetCategories();
  const { data: tags = [] } = useGetTags();
  const createTag = useCreateTag();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<TransactionId>>(new Set());

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (filterAccount !== 'all' && transaction.accountId.toString() !== filterAccount) {
        return false;
      }
      if (filterCategory !== 'all' && transaction.categoryId.toString() !== filterCategory) {
        return false;
      }
      if (searchQuery) {
        const category = categories.find((c) => c.id === transaction.categoryId);
        const account = accounts.find((a) => a.id === transaction.accountId);
        const transactionTags = tags.filter((tag) => transaction.tags.some((id) => id === tag.id));
        const searchLower = searchQuery.toLowerCase();
        return (
          category?.name.toLowerCase().includes(searchLower) ||
          account?.name.toLowerCase().includes(searchLower) ||
          transactionTags.some((tag) => tag.name.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }, [transactions, filterAccount, filterCategory, searchQuery, categories, accounts, tags]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: TransactionId, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkEdit = async (action: BulkEditAction) => {
    toast.error('Bulk edit is not yet implemented in the backend');
    // Backend implementation needed
  };

  const handleBulkDelete = async () => {
    toast.error('Bulk delete is not yet implemented in the backend');
    // Backend implementation needed
  };

  const handleExportCsv = () => {
    const transactionsToExport = selectedIds.size > 0
      ? filteredTransactions.filter((t) => selectedIds.has(t.id))
      : filteredTransactions;

    const csv = exportTransactionsToCsv(transactionsToExport, accounts, categories, tags);
    const filename = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsv(csv, filename);
    toast.success(`Exported ${transactionsToExport.length} transaction${transactionsToExport.length !== 1 ? 's' : ''}`);
  };

  const handleImportCsv = async (rows: CsvRow[]) => {
    const results = { created: 0, failed: 0, errors: [] as string[] };

    for (const row of rows) {
      try {
        const account = accounts.find((a) => a.name.toLowerCase() === row.accountName.toLowerCase());
        const category = categories.find((c) => c.name.toLowerCase() === row.categoryName.toLowerCase());

        if (!account || !category) {
          results.failed++;
          results.errors.push(`Row skipped: account or category not found`);
          continue;
        }

        // Parse tags
        const tagIds: bigint[] = [];
        if (row.tags) {
          const tagNames = row.tags.split(',').map((t) => t.trim()).filter(Boolean);
          for (const tagName of tagNames) {
            let tag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
            if (!tag) {
              // Create missing tag
              const newTagId = await createTag.mutateAsync(tagName);
              tagIds.push(newTagId);
            } else {
              tagIds.push(tag.id);
            }
          }
        }

        const amount = parseFloat(row.amount);
        const finalAmount = category.isExpense ? -Math.abs(amount) : Math.abs(amount);

        // Note: This would need a batch import API in the backend
        // For now, we'll show an error
        results.failed++;
        results.errors.push('Batch import not yet implemented in backend');
      } catch (error: any) {
        results.failed++;
        results.errors.push(error.message || 'Unknown error');
      }
    }

    return results;
  };

  const allSelected = filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredTransactions.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">View and manage all transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCsvImportOpen(true)} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={handleExportCsv} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Transaction
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <Card className="border-primary">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Clear Selection
                </Button>
              </div>
              <Button onClick={() => setBulkEditOpen(true)} className="gap-2">
                <Edit className="h-4 w-4" />
                Bulk Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter transactions by account, category, or search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger>
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id.toString()} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id.toString()} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
              </p>
              {transactions.length === 0 && (
                <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const category = categories.find((c) => c.id === transaction.categoryId);
                  const account = accounts.find((a) => a.id === transaction.accountId);
                  const isSelected = selectedIds.has(transaction.id);

                  return (
                    <TableRow key={transaction.id.toString()}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectOne(transaction.id, checked as boolean)}
                          aria-label="Select row"
                        />
                      </TableCell>
                      <TableCell>{formatDate(Number(transaction.date))}</TableCell>
                      <TableCell>{account?.name || 'Unknown'}</TableCell>
                      <TableCell>{category?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <TagChips tagIds={transaction.tags} tags={tags} />
                      </TableCell>
                      <TableCell className={`text-right font-mono ${transaction.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TransactionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedTransactionIds={Array.from(selectedIds)}
        onBulkEdit={handleBulkEdit}
        onBulkDelete={handleBulkDelete}
      />
      <CsvImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        onImport={handleImportCsv}
      />
    </div>
  );
}
