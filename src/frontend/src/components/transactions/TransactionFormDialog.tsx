import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAccounts, useGetCategories, useCreateTransaction } from '../../hooks/useFinanceQueries';
import { Loader2 } from 'lucide-react';
import type { AccountId } from '../../backend';

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAccountId?: AccountId;
}

export default function TransactionFormDialog({ open, onOpenChange, defaultAccountId }: TransactionFormDialogProps) {
  const { data: accounts = [] } = useGetAccounts();
  const { data: categories = [] } = useGetCategories();
  const createTransaction = useCreateTransaction();

  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (defaultAccountId) {
      setAccountId(defaultAccountId.toString());
    }
  }, [defaultAccountId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!accountId) {
      newErrors.accountId = 'Account is required';
    }
    if (!categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) === 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedCategory = categories.find((c) => c.id.toString() === categoryId);
    const finalAmount = selectedCategory?.isExpense ? -Math.abs(Number(amount)) : Math.abs(Number(amount));

    createTransaction.mutate(
      {
        accountId: BigInt(accountId),
        categoryId: BigInt(categoryId),
        amount: finalAmount,
        date: BigInt(new Date(date).getTime()),
      },
      {
        onSuccess: () => {
          setAccountId(defaultAccountId?.toString() || '');
          setCategoryId('');
          setAmount('');
          setDate(new Date().toISOString().split('T')[0]);
          setErrors({});
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Record a new income or expense transaction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="account">Account</Label>
              <Select value={accountId} onValueChange={setAccountId} disabled={createTransaction.isPending}>
                <SelectTrigger id="account" className="mt-2">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id.toString()} value={account.id.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && <p className="text-sm text-destructive mt-1">{errors.accountId}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={createTransaction.isPending}>
                <SelectTrigger id="category" className="mt-2">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id.toString()} value={category.id.toString()}>
                      {category.name} ({category.isExpense ? 'Expense' : 'Income'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId}</p>}
            </div>

            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-2"
                disabled={createTransaction.isPending}
              />
              {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount}</p>}
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2"
                disabled={createTransaction.isPending}
              />
              {errors.date && <p className="text-sm text-destructive mt-1">{errors.date}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createTransaction.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTransaction.isPending}>
              {createTransaction.isPending ? (
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
  );
}
