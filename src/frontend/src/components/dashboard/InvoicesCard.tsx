import { useMemo } from 'react';
import { useGetInvoices } from '../../hooks/useFinanceQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt } from 'lucide-react';
import { formatCurrency } from '../../lib/format';

export default function InvoicesCard() {
  const { data: invoices = [], isLoading } = useGetInvoices();

  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const unpaidCount = invoices.filter(
      (inv) => inv.status.__kind__ === 'Sent' || inv.status.__kind__ === 'Overdue'
    ).length;
    const overdueCount = invoices.filter((inv) => inv.status.__kind__ === 'Overdue').length;
    const totalPaidValue = invoices
      .filter((inv) => inv.status.__kind__ === 'Paid')
      .reduce((sum, inv) => sum + inv.total, 0);

    return { totalInvoices, unpaidCount, overdueCount, totalPaidValue };
  }, [invoices]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invoices</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Invoices</CardTitle>
        <Receipt className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Invoices</span>
            <span className="text-2xl font-bold">{stats.totalInvoices}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Unpaid</span>
            <span className="text-lg font-semibold text-orange-600">{stats.unpaidCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Overdue</span>
            <span className="text-lg font-semibold text-destructive">{stats.overdueCount}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground">Total Paid</span>
            <span className="text-lg font-bold text-green-600">{formatCurrency(stats.totalPaidValue)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
