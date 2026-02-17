import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '../../lib/format';
import type { Transaction, Category } from '../../backend';

interface CategoryBreakdownChartProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function CategoryBreakdownChart({ transactions, categories }: CategoryBreakdownChartProps) {
  const categoryData = useMemo(() => {
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
      .sort((a, b) => b.total - a.total);

    const totalExpense = data.reduce((sum, item) => sum + item.total, 0);

    return data.map((item) => ({
      ...item,
      percentage: totalExpense > 0 ? (item.total / totalExpense) * 100 : 0,
    }));
  }, [transactions, categories]);

  const colors = [
    'oklch(0.646 0.222 41.116)',
    'oklch(0.6 0.118 184.704)',
    'oklch(0.398 0.07 227.392)',
    'oklch(0.828 0.189 84.429)',
    'oklch(0.769 0.188 70.08)',
  ];

  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
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
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Breakdown of expenses by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoryData.map((item, index) => (
            <div key={item.categoryId} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-muted-foreground">{formatCurrency(item.total)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
