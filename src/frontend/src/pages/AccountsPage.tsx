import { useState } from 'react';
import { useGetAccounts, useCreateAccount } from '../hooks/useFinanceQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Wallet, Loader2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { useNavigate } from '@tanstack/react-router';

export default function AccountsPage() {
  const navigate = useNavigate();
  const { data: accounts = [], isLoading } = useGetAccounts();
  const createAccount = useCreateAccount();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createAccount.mutate(name.trim(), {
        onSuccess: () => {
          setName('');
          setOpen(false);
        },
      });
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your financial accounts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Account</DialogTitle>
                <DialogDescription>Add a new account to track your finances</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Checking Account"
                  className="mt-2"
                  autoFocus
                  disabled={createAccount.isPending}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={createAccount.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!name.trim() || createAccount.isPending}>
                  {createAccount.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Balance</CardTitle>
          <CardDescription>Combined balance across all accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
            <p className="text-muted-foreground mb-4">Create your first account to get started</p>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id.toString()} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate({ to: '/accounts/$accountId', params: { accountId: account.id.toString() } })}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(account.balance)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
