import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '../../lib/format';
import type { Transaction, Category } from '../../backend';

interface TopCategoriesProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function TopCategories({ transactions, categories }: TopCategoriesProps) {
  const topCategories = useMemo(() => {
    const totals = new Map<string, number>();

    transactions.forEach((transaction) => {
      if (transaction.amount < 0) {
        const categoryId = transaction.categoryId.toString();
        totals.set(categoryId, (totals.get(categoryId) || 0) + Math.abs(transaction.amount));
      }
    });

    const data = Array.from(totals.entries())
      .map(([categoryId, total]) => {
        const category = categories.find((c) => c.id.toString() === categoryId);
        return {
          categoryId,
          name: category?.name || 'Unknown',
          total,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const totalExpense = Array.from(totals.values()).reduce((sum, val) => sum + val, 0);

    return data.map((item) => ({
      ...item,
      percentage: totalExpense > 0 ? (item.total / totalExpense) * 100 : 0,
    }));
  }, [transactions, categories]);

  if (topCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Spending Categories</CardTitle>
          <CardDescription>No expense data for this period</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No expenses to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Spending Categories</CardTitle>
        <CardDescription>Your highest expense categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topCategories.map((item, index) => (
            <div key={item.categoryId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.percentage.toFixed(1)}% of total</p>
                </div>
              </div>
              <p className="font-mono font-semibold">{formatCurrency(item.total)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
