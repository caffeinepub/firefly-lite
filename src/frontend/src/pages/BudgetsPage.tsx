import { useState, useMemo } from 'react';
import { useGetCategories, useGetBudgets, useCreateBudget, useUpdateBudget, useGetTransactions } from '../hooks/useFinanceQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, DollarSign, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { BudgetCategoryLimit, Category } from '../backend';

export default function BudgetsPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategories();
  const { data: budgets = [], isLoading: budgetsLoading } = useGetBudgets();
  const { data: transactions = [], isLoading: transactionsLoading } = useGetTransactions();
  const createBudgetMutation = useCreateBudget();
  const updateBudgetMutation = useUpdateBudget();

  // Filter expense categories
  const expenseCategories = useMemo(() => {
    return categories.filter((cat) => cat.isExpense);
  }, [categories]);

  // Calculate month in YYYYMM format
  const selectedMonthInt = useMemo(() => {
    return BigInt(selectedYear * 100 + selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Find budget for selected month
  const currentBudget = useMemo(() => {
    return budgets.find((b) => b.month === selectedMonthInt);
  }, [budgets, selectedMonthInt]);

  // Initialize category limits state
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});

  // Update state when budget changes
  useMemo(() => {
    if (currentBudget) {
      const limits: Record<string, string> = {};
      currentBudget.categoryLimits.forEach((limit) => {
        limits[limit.categoryId.toString()] = limit.limitAmount.toString();
      });
      setCategoryLimits(limits);
    } else {
      setCategoryLimits({});
    }
  }, [currentBudget]);

  // Calculate spending per category for selected month
  const categorySpending = useMemo(() => {
    const spending: Record<string, number> = {};
    
    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getTime();
    const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999).getTime();
    
    transactions.forEach((t) => {
      const txDate = Number(t.date);
      if (txDate >= startOfMonth && txDate <= endOfMonth) {
        const category = categories.find((c) => c.id === t.categoryId);
        if (category?.isExpense) {
          const catId = t.categoryId.toString();
          spending[catId] = (spending[catId] || 0) + Math.abs(t.amount);
        }
      }
    });
    
    return spending;
  }, [transactions, categories, selectedYear, selectedMonth]);

  // Calculate carryover from previous month
  const carryOver = useMemo(() => {
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevMonthInt = BigInt(prevYear * 100 + prevMonth);
    
    const prevBudget = budgets.find((b) => b.month === prevMonthInt);
    if (!prevBudget) return 0;
    
    let totalLimit = 0;
    let totalSpent = 0;
    
    prevBudget.categoryLimits.forEach((limit) => {
      totalLimit += limit.limitAmount;
    });
    
    const prevStartOfMonth = new Date(prevYear, prevMonth - 1, 1).getTime();
    const prevEndOfMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999).getTime();
    
    transactions.forEach((t) => {
      const txDate = Number(t.date);
      if (txDate >= prevStartOfMonth && txDate <= prevEndOfMonth) {
        const category = categories.find((c) => c.id === t.categoryId);
        if (category?.isExpense) {
          totalSpent += Math.abs(t.amount);
        }
      }
    });
    
    return totalLimit - totalSpent;
  }, [budgets, transactions, categories, selectedYear, selectedMonth]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleLimitChange = (categoryId: string, value: string) => {
    setCategoryLimits((prev) => ({
      ...prev,
      [categoryId]: value,
    }));
  };

  const handleSaveBudget = async () => {
    try {
      const limits: BudgetCategoryLimit[] = [];
      
      Object.entries(categoryLimits).forEach(([catId, limitStr]) => {
        const limitAmount = parseFloat(limitStr);
        if (!isNaN(limitAmount) && limitAmount > 0) {
          limits.push({
            categoryId: BigInt(catId),
            limitAmount,
          });
        }
      });

      if (currentBudget) {
        await updateBudgetMutation.mutateAsync({
          budgetId: currentBudget.id,
          month: selectedMonthInt,
          categoryLimits: limits,
          carryOver,
        });
      } else {
        await createBudgetMutation.mutateAsync({
          month: selectedMonthInt,
          categoryLimits: limits,
          carryOver,
        });
      }

      toast.success('Budget saved successfully');
    } catch (error) {
      console.error('Failed to save budget:', error);
      toast.error('Failed to save budget');
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const isLoading = categoriesLoading || budgetsLoading || transactionsLoading;
  const isSaving = createBudgetMutation.isPending || updateBudgetMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Budgets</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading budgets...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (expenseCategories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Budgets</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You need to create expense categories before setting up budgets.
            </p>
            <Button onClick={() => window.location.href = '/categories'}>
              Go to Categories
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate totals
  let totalLimit = 0;
  let totalSpent = 0;
  let totalRemaining = 0;

  expenseCategories.forEach((cat) => {
    const catId = cat.id.toString();
    const limit = parseFloat(categoryLimits[catId] || '0');
    const spent = categorySpending[catId] || 0;
    totalLimit += limit;
    totalSpent += spent;
    totalRemaining += limit - spent;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budgets</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monthly Budget</CardTitle>
              <CardDescription>Set spending limits for each expense category</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[180px] text-center font-semibold">{monthName}</div>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Total Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalLimit.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Total Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalRemaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  ${totalRemaining.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {carryOver !== 0 && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Carryover from previous month:{' '}
                <span className={carryOver > 0 ? 'text-green-600' : 'text-destructive'}>
                  ${carryOver.toFixed(2)}
                </span>
              </p>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Budget Limit</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseCategories.map((category) => {
                  const catId = category.id.toString();
                  const limit = parseFloat(categoryLimits[catId] || '0');
                  const spent = categorySpending[catId] || 0;
                  const remaining = limit - spent;
                  const percentage = limit > 0 ? (spent / limit) * 100 : 0;

                  return (
                    <TableRow key={category.id.toString()}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={categoryLimits[catId] || ''}
                          onChange={(e) => handleLimitChange(catId, e.target.value)}
                          className="w-32 ml-auto text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">${spent.toFixed(2)}</TableCell>
                      <TableCell className={`text-right ${remaining < 0 ? 'text-destructive' : ''}`}>
                        ${remaining.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {limit > 0 ? (
                          <Badge
                            variant={
                              percentage >= 100
                                ? 'destructive'
                                : percentage >= 80
                                ? 'outline'
                                : 'secondary'
                            }
                          >
                            {percentage.toFixed(0)}%
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not set</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveBudget} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Budget'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
