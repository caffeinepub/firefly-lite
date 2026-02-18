import { useState, useMemo } from 'react';
import { useGetTransactions, useGetAccounts, useGetCategories, useGetTags, useCreateTag, useCreateTransactionsFromCsv } from '../hooks/useFinanceQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Download, Upload, Edit2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/format';
import TransactionFormDialog from '../components/transactions/TransactionFormDialog';
import BulkEditDialog from '../components/transactions/BulkEditDialog';
import CsvImportDialog from '../components/transactions/CsvImportDialog';
import TagChips from '../components/tags/TagChips';
import { exportTransactionsToCsv } from '../utils/transactionsCsv';
import { toast } from 'sonner';
import type { CsvTransactionRow } from '../backend';

export default function TransactionsPage() {
  const { data: transactions = [], isLoading: transactionsLoading } = useGetTransactions();
  const { data: accounts = [] } = useGetAccounts();
  const { data: categories = [] } = useGetCategories();
  const { data: tags = [] } = useGetTags();
  const importCsvMutation = useCreateTransactionsFromCsv();

  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<bigint>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (accountFilter !== 'all' && txn.accountId.toString() !== accountFilter) {
        return false;
      }

      if (categoryFilter !== 'all' && txn.categoryId.toString() !== categoryFilter) {
        return false;
      }

      if (typeFilter !== 'all') {
        const category = categories.find((c) => c.id === txn.categoryId);
        if (typeFilter === 'expense' && !category?.isExpense) return false;
        if (typeFilter === 'income' && category?.isExpense) return false;
      }

      if (searchQuery) {
        const account = accounts.find((a) => a.id === txn.accountId);
        const category = categories.find((c) => c.id === txn.categoryId);
        const searchLower = searchQuery.toLowerCase();
        
        if (
          !account?.name.toLowerCase().includes(searchLower) &&
          !category?.name.toLowerCase().includes(searchLower) &&
          !txn.amount.toString().includes(searchQuery)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, accountFilter, categoryFilter, typeFilter, searchQuery, accounts, categories]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => Number(b.date) - Number(a.date));
  }, [filteredTransactions]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(new Set(sortedTransactions.map((t) => t.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleSelectTransaction = (id: bigint, checked: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTransactions(newSelected);
  };

  const handleExportCsv = () => {
    try {
      const transactionsToExport = selectedTransactions.size > 0
        ? sortedTransactions.filter((t) => selectedTransactions.has(t.id))
        : sortedTransactions;
      
      exportTransactionsToCsv(transactionsToExport, accounts, categories, tags);
      toast.success(`Exported ${transactionsToExport.length} transactions`);
    } catch (error) {
      toast.error('Failed to export transactions');
      console.error('Export error:', error);
    }
  };

  const handleCsvImport = async (rows: any[]) => {
    try {
      const csvRows: CsvTransactionRow[] = rows.map((row) => ({
        accountId: BigInt(row.accountId),
        categoryId: BigInt(row.categoryId),
        amount: row.amount,
        date: BigInt(row.date),
        tagIds: row.tagIds || [],
      }));

      const result = await importCsvMutation.mutateAsync(csvRows);
      return {
        created: result.length,
        failed: 0,
        errors: [],
      };
    } catch (error: any) {
      return {
        created: 0,
        failed: rows.length,
        errors: [error.message || 'Import failed'],
      };
    }
  };

  const handleBulkEdit = async () => {
    toast.info('Bulk edit functionality coming soon');
  };

  const handleBulkDelete = async () => {
    toast.info('Bulk delete functionality coming soon');
  };

  const isLoading = transactionsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Transactions</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading transactions...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCsvImportOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExportCsv} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {selectedTransactions.size > 0 && (
        <Card className="bg-muted">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedTransactions.size} transaction{selectedTransactions.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkEditOpen(true)}
                  className="gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Bulk Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTransactions(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id.toString()} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id.toString()} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {transactions.length === 0
                  ? 'No transactions yet. Add your first transaction to get started.'
                  : 'No transactions match your filters.'}
              </p>
              {transactions.length === 0 && (
                <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTransactions.size === sortedTransactions.length && sortedTransactions.length > 0}
                      onCheckedChange={handleSelectAll}
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
                {sortedTransactions.map((transaction) => {
                  const account = accounts.find((a) => a.id === transaction.accountId);
                  const category = categories.find((c) => c.id === transaction.categoryId);
                  const isExpense = category?.isExpense;

                  return (
                    <TableRow key={transaction.id.toString()}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTransactions.has(transaction.id)}
                          onCheckedChange={(checked) =>
                            handleSelectTransaction(transaction.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>{formatDate(Number(transaction.date))}</TableCell>
                      <TableCell>{account?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {category?.name || 'Unknown'}
                          <Badge variant={isExpense ? 'destructive' : 'secondary'} className="text-xs">
                            {isExpense ? 'Expense' : 'Income'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TagChips tagIds={transaction.tags} tags={tags} />
                      </TableCell>
                      <TableCell className={`text-right font-medium ${isExpense ? 'text-destructive' : 'text-green-600'}`}>
                        {isExpense ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TransactionFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
      <BulkEditDialog
        open={isBulkEditOpen}
        onOpenChange={setIsBulkEditOpen}
        selectedTransactionIds={Array.from(selectedTransactions)}
        onBulkEdit={handleBulkEdit}
        onBulkDelete={handleBulkDelete}
      />
      <CsvImportDialog open={isCsvImportOpen} onOpenChange={setIsCsvImportOpen} onImport={handleCsvImport} />
    </div>
  );
}
