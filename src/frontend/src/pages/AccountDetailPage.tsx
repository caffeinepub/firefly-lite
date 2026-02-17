import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetAccounts, useGetTransactions, useGetCategories } from '../hooks/useFinanceQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/format';
import TransactionFormDialog from '../components/transactions/TransactionFormDialog';
import type { Transaction } from '../backend';

export default function AccountDetailPage() {
  const { accountId } = useParams({ from: '/accounts/$accountId' });
  const navigate = useNavigate();
  const { data: accounts = [] } = useGetAccounts();
  const { data: allTransactions = [], isLoading } = useGetTransactions();
  const { data: categories = [] } = useGetCategories();
  const [dialogOpen, setDialogOpen] = useState(false);

  const account = accounts.find((a) => a.id.toString() === accountId);
  const transactions = allTransactions.filter((t) => t.accountId.toString() === accountId);

  if (!account) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate({ to: '/accounts' })} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Accounts
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Account not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate({ to: '/accounts' })} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Accounts
      </Button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{account.name}</h1>
          <p className="text-muted-foreground mt-1">Account details and transactions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>Total balance for this account</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{formatCurrency(account.balance)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>All transactions for this account</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No transactions yet</p>
              <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const category = categories.find((c) => c.id === transaction.categoryId);
                  return (
                    <TableRow key={transaction.id.toString()}>
                      <TableCell>{formatDate(Number(transaction.date))}</TableCell>
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

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultAccountId={account.id}
      />
    </div>
  );
}
