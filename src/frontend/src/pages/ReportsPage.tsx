import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetReports, useDeleteReport } from '../hooks/useFinanceQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Eye, Download, Trash2, BarChart3 } from 'lucide-react';
import { formatDate } from '../lib/format';
import { ReportType } from '../backend';
import { toast } from 'sonner';
import { downloadReportPdf } from '../utils/reportPdf';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { data: reports = [], isLoading } = useGetReports();
  const deleteReportMutation = useDeleteReport();

  const [reportTypeFilter, setReportTypeFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<bigint | null>(null);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (reportTypeFilter !== 'all' && report.reportType !== reportTypeFilter) {
        return false;
      }

      if (startDateFilter) {
        const filterStart = new Date(startDateFilter).getTime();
        if (Number(report.startDate) < filterStart) {
          return false;
        }
      }

      if (endDateFilter) {
        const filterEnd = new Date(endDateFilter).getTime();
        if (Number(report.endDate) > filterEnd) {
          return false;
        }
      }

      return true;
    });
  }, [reports, reportTypeFilter, startDateFilter, endDateFilter]);

  const getReportTypeName = (type: ReportType) => {
    switch (type) {
      case ReportType.incomeVsExpenses:
        return 'Income vs. Expenses';
      case ReportType.categoryBreakdown:
        return 'Category Breakdown';
      default:
        return 'Unknown';
    }
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;

    try {
      await deleteReportMutation.mutateAsync(reportToDelete);
      toast.success('Report deleted successfully');
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    } catch (error) {
      toast.error('Failed to delete report');
      console.error('Delete error:', error);
    }
  };

  const handleDownload = async (reportId: bigint) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    try {
      await downloadReportPdf(report, null);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report');
      console.error('Download error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Generate and view financial reports</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading reports...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and view financial reports</p>
        </div>
        <Button onClick={() => navigate({ to: '/reports/new' })} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter reports by type and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={ReportType.incomeVsExpenses}>Income vs. Expenses</SelectItem>
                  <SelectItem value={ReportType.categoryBreakdown}>Category Breakdown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>
            {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reports found</h3>
              <p className="text-muted-foreground mb-4">
                {reports.length === 0
                  ? 'Create your first report to get started'
                  : 'Try adjusting your filters'}
              </p>
              {reports.length === 0 && (
                <Button onClick={() => navigate({ to: '/reports/new' })} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Report
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id.toString()}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>{getReportTypeName(report.reportType)}</TableCell>
                    <TableCell>
                      {formatDate(Number(report.startDate))} - {formatDate(Number(report.endDate))}
                    </TableCell>
                    <TableCell>{formatDate(Number(report.createdAt))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate({ to: `/reports/${report.id}` })}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(report.id)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReportToDelete(report.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReportToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
