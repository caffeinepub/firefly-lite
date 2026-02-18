import { useNavigate, useParams } from '@tanstack/react-router';
import { useGetReport, useDeleteReport } from '../hooks/useFinanceQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Download, ArrowLeft } from 'lucide-react';
import { formatDate } from '../lib/format';
import { ReportType } from '../backend';
import { toast } from 'sonner';
import { useState } from 'react';
import ReportResultsView from '../components/reports/ReportResultsView';
import { downloadReportPdf } from '../utils/reportPdf';

export default function ReportDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const reportId = params.reportId ? BigInt(params.reportId) : null;

  const { data: report, isLoading } = useGetReport(reportId || BigInt(0));
  const deleteReportMutation = useDeleteReport();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
    if (!reportId) return;

    try {
      await deleteReportMutation.mutateAsync(reportId);
      toast.success('Report deleted successfully');
      navigate({ to: '/reports' });
    } catch (error) {
      toast.error('Failed to delete report');
      console.error('Delete error:', error);
    }
  };

  const handleDownload = async () => {
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
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading report...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Report not found</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => navigate({ to: '/reports' })}>Back to Reports</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/reports' })} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{report.name}</h1>
            <p className="text-muted-foreground">{getReportTypeName(report.reportType)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: `/reports/${reportId}/edit` })} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Summary</CardTitle>
          <CardDescription>Overview of report configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Report Type</p>
              <p className="font-medium">{getReportTypeName(report.reportType)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date Range</p>
              <p className="font-medium">
                {formatDate(Number(report.startDate))} - {formatDate(Number(report.endDate))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(Number(report.createdAt))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{formatDate(Number(report.updatedAt))}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Results</CardTitle>
          <CardDescription>Detailed breakdown and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportResultsView
            reportType={report.reportType}
            startDate={report.startDate}
            endDate={report.endDate}
            filters={report.filters || null}
          />
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
