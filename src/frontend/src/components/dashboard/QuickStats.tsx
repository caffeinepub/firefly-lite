import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../lib/format';
import type { Transaction, Category } from '../../backend';

interface QuickStatsProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function QuickStats({ transactions, categories }: QuickStatsProps) {
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((transaction) => {
      if (transaction.amount > 0) {
        income += transaction.amount;
      } else {
        expense += Math.abs(transaction.amount);
      }
    });

    const net = income - expense;

    return { income, expense, net };
  }, [transactions]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.income)}</div>
          <p className="text-xs text-muted-foreground mt-1">Total income for period</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.expense)}</div>
          <p className="text-xs text-muted-foreground mt-1">Total expenses for period</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(stats.net)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Income minus expenses</p>
        </CardContent>
      </Card>
    </div>
  );
}
