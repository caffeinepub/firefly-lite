import { useState, useMemo } from 'react';
import { useGetTransactions, useGetAccounts, useGetCategories } from '../hooks/useFinanceQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Loader2, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/format';
import TransactionFormDialog from '../components/transactions/TransactionFormDialog';

export default function TransactionsPage() {
  const { data: transactions = [], isLoading } = useGetTransactions();
  const { data: accounts = [] } = useGetAccounts();
  const { data: categories = [] } = useGetCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

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
        const searchLower = searchQuery.toLowerCase();
        return (
          category?.name.toLowerCase().includes(searchLower) ||
          account?.name.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [transactions, filterAccount, filterCategory, searchQuery, categories, accounts]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">View and manage all transactions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Transaction
        </Button>
      </div>

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
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const category = categories.find((c) => c.id === transaction.categoryId);
                  const account = accounts.find((a) => a.id === transaction.accountId);
                  return (
                    <TableRow key={transaction.id.toString()}>
                      <TableCell>{formatDate(Number(transaction.date))}</TableCell>
                      <TableCell>{account?.name || 'Unknown'}</TableCell>
                      <TableCell>{category?.name || 'Unknown'}</TableCell>
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
    </div>
  );
}
