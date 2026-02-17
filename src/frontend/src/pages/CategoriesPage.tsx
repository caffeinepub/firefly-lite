import { useState, useMemo } from 'react';
import { useGetCategories, useGetTransactionsByDateRange, useCreateCategory } from '../hooks/useFinanceQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Tag } from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { startOfMonth, endOfMonth } from 'date-fns';

type DateRangeOption = 'current-month' | 'last-month' | 'current-year';

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useGetCategories();
  const createCategory = useCreateCategory();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isExpense, setIsExpense] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeOption>('current-month');

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'current-month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      case 'current-year':
        return { startDate: new Date(now.getFullYear(), 0, 1), endDate: new Date(now.getFullYear(), 11, 31) };
    }
  }, [dateRange]);

  const { data: transactions = [] } = useGetTransactionsByDateRange(
    BigInt(startDate.getTime()),
    BigInt(endDate.getTime())
  );

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    transactions.forEach((transaction) => {
      const categoryId = transaction.categoryId.toString();
      totals.set(categoryId, (totals.get(categoryId) || 0) + transaction.amount);
    });
    return totals;
  }, [transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createCategory.mutate(
        { name: name.trim(), isExpense },
        {
          onSuccess: () => {
            setName('');
            setIsExpense(true);
            setOpen(false);
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your transactions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
                <DialogDescription>Add a new category to organize your transactions</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Groceries"
                    className="mt-2"
                    autoFocus
                    disabled={createCategory.isPending}
                  />
                </div>
                <div>
                  <Label htmlFor="category-type">Type</Label>
                  <Select value={isExpense ? 'expense' : 'income'} onValueChange={(value) => setIsExpense(value === 'expense')}>
                    <SelectTrigger id="category-type" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={createCategory.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!name.trim() || createCategory.isPending}>
                  {createCategory.isPending ? (
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

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Spending by Category</h2>
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangeOption)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-month">Current Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="current-year">Current Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
            <p className="text-muted-foreground mb-4">Create your first category to organize transactions</p>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const total = categoryTotals.get(category.id.toString()) || 0;
                return (
                  <TableRow key={category.id.toString()}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant={category.isExpense ? 'destructive' : 'default'}>
                        {category.isExpense ? 'Expense' : 'Income'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono ${total >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(total)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
