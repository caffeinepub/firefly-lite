import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetReports } from '../../hooks/useFinanceQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus } from 'lucide-react';
import { ReportType } from '../../backend';

export default function ReportsCard() {
  const navigate = useNavigate();
  const { data: reports = [], isLoading } = useGetReports();

  const stats = useMemo(() => {
    if (reports.length === 0) {
      return {
        lastReportType: null,
        mostUsedType: null,
      };
    }

    const sortedByDate = [...reports].sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    const lastReportType = sortedByDate[0]?.reportType || null;

    const typeCounts: Record<string, number> = {};
    reports.forEach((report) => {
      typeCounts[report.reportType] = (typeCounts[report.reportType] || 0) + 1;
    });

    const sortedTypes = Object.entries(typeCounts).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });

    const mostUsedType = sortedTypes[0]?.[0] || null;

    return { lastReportType, mostUsedType };
  }, [reports]);

  const getReportTypeName = (type: ReportType | string | null) => {
    if (!type) return 'None';
    switch (type) {
      case ReportType.incomeVsExpenses:
        return 'Income vs. Expenses';
      case ReportType.categoryBreakdown:
        return 'Category Breakdown';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reports</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
        <CardTitle className="text-sm font-medium">Reports</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Last Report Type</p>
            <p className="font-medium">{getReportTypeName(stats.lastReportType)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Most Used Type</p>
            <p className="font-medium">{getReportTypeName(stats.mostUsedType)}</p>
          </div>
          <Button onClick={() => navigate({ to: '/reports/new' })} className="w-full gap-2 mt-2">
            <Plus className="h-4 w-4" />
            Run New Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
