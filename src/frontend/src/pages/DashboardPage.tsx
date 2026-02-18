import { useState, useMemo } from 'react';
import { useGetTransactionsByDateRange, useGetAccounts, useGetCategories } from '../hooks/useFinanceQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuickStats from '../components/dashboard/QuickStats';
import CategoryBreakdownChart from '../components/dashboard/CategoryBreakdownChart';
import TopCategories from '../components/dashboard/TopCategories';
import InvoicesCard from '../components/dashboard/InvoicesCard';
import ReportsCard from '../components/dashboard/ReportsCard';
import { Plus, Wallet, ArrowLeftRight } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

type DateRangeOption = 'current-month' | 'last-month' | 'current-year';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRangeOption>('current-month');

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'current-month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      case 'current-year':
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
    }
  }, [dateRange]);

  const { data: transactions = [], isLoading: transactionsLoading } = useGetTransactionsByDateRange(
    BigInt(startDate.getTime()),
    BigInt(endDate.getTime())
  );
  const { data: accounts = [] } = useGetAccounts();
  const { data: categories = [] } = useGetCategories();

  const hasData = accounts.length > 0 || transactions.length > 0;

  if (!transactionsLoading && !hasData) {
    return (
      <div className="space-y-6">
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gradient-to-r from-green-500/10 to-green-600/10 flex items-center justify-center">
          <img
            src="/assets/generated/dashboard-hero.dim_1600x400.png"
            alt="Dashboard"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome to Firefly Lite</CardTitle>
            <CardDescription>Get started by creating your first account and transaction</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="flex gap-3">
              <Button onClick={() => navigate({ to: '/accounts' })} className="gap-2">
                <Wallet className="h-4 w-4" />
                Create Account
              </Button>
              <Button onClick={() => navigate({ to: '/transactions' })} variant="outline" className="gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                Add Transaction
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative w-full h-48 rounded-lg overflow-hidden">
        <img
          src="/assets/generated/dashboard-hero.dim_1600x400.png"
          alt="Dashboard"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent flex items-center">
          <div className="container">
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Overview of your finances</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Financial Overview</h2>
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

      <QuickStats transactions={transactions} categories={categories} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CategoryBreakdownChart transactions={transactions} categories={categories} />
        <TopCategories transactions={transactions} categories={categories} />
        <InvoicesCard />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportsCard />
      </div>
    </div>
  );
}
