import { useMemo } from 'react';
import { useGetTransactionsByDateRange, useGetCategories } from '../../hooks/useFinanceQueries';
import { ReportType } from '../../backend';
import { formatCurrency } from '../../lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

interface ReportResultsViewProps {
  reportType: ReportType;
  startDate: bigint;
  endDate: bigint;
  filters: string | null;
}

export default function ReportResultsView({ reportType, startDate, endDate, filters }: ReportResultsViewProps) {
  const { data: transactions = [], isLoading: transactionsLoading } = useGetTransactionsByDateRange(startDate, endDate);
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategories();

  const isLoading = transactionsLoading || categoriesLoading;

  const results = useMemo(() => {
    if (isLoading || transactions.length === 0 || categories.length === 0) {
      return null;
    }

    const categoryMap = new Map(categories.map((cat) => [cat.id.toString(), cat]));

    if (reportType === ReportType.incomeVsExpenses) {
      let totalIncome = 0;
      let totalExpenses = 0;
      const incomeByCategory: Record<string, number> = {};
      const expensesByCategory: Record<string, number> = {};

      transactions.forEach((txn) => {
        const category = categoryMap.get(txn.categoryId.toString());
        if (!category) return;

        if (category.isExpense) {
          totalExpenses += txn.amount;
          expensesByCategory[category.name] = (expensesByCategory[category.name] || 0) + txn.amount;
        } else {
          totalIncome += txn.amount;
          incomeByCategory[category.name] = (incomeByCategory[category.name] || 0) + txn.amount;
        }
      });

      const netIncome = totalIncome - totalExpenses;

      return {
        type: 'incomeVsExpenses' as const,
        totalIncome,
        totalExpenses,
        netIncome,
        incomeByCategory: Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]),
        expensesByCategory: Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]),
      };
    }

    if (reportType === ReportType.categoryBreakdown) {
      const categoryTotals: Record<string, { name: string; total: number; count: number }> = {};

      transactions.forEach((txn) => {
        const category = categoryMap.get(txn.categoryId.toString());
        if (!category) return;

        if (!categoryTotals[category.id.toString()]) {
          categoryTotals[category.id.toString()] = {
            name: category.name,
            total: 0,
            count: 0,
          };
        }

        categoryTotals[category.id.toString()].total += txn.amount;
        categoryTotals[category.id.toString()].count += 1;
      });

      const sortedCategories = Object.values(categoryTotals).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

      return {
        type: 'categoryBreakdown' as const,
        categories: sortedCategories,
      };
    }

    return null;
  }, [reportType, transactions, categories, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No data available for the selected period</p>
      </div>
    );
  }

  if (results.type === 'incomeVsExpenses') {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Income</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(results.totalIncome)}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(results.totalExpenses)}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Net Income</p>
            <p className={`text-2xl font-bold ${results.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(results.netIncome)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold mb-3">Income by Category</h3>
            {results.incomeByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No income transactions</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.incomeByCategory.map(([name, amount]) => (
                    <TableRow key={name}>
                      <TableCell>{name}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Expenses by Category</h3>
            {results.expensesByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expense transactions</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.expensesByCategory.map(([name, amount]) => (
                    <TableRow key={name}>
                      <TableCell>{name}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (results.type === 'categoryBreakdown') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Spending by Category</h3>
        {results.categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.categories.map((cat) => (
                <TableRow key={cat.name}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-right">{cat.count}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(cat.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  }

  return null;
}
