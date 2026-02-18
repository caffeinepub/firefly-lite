import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useGetReport, useCreateReport, useUpdateReport, useGetCategories, useGetAccounts, useGetTags } from '../hooks/useFinanceQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportType } from '../backend';
import { toast } from 'sonner';
import { Loader2, Save, Download } from 'lucide-react';
import ReportResultsView from '../components/reports/ReportResultsView';
import { downloadReportPdf } from '../utils/reportPdf';
import TagMultiSelect from '../components/tags/TagMultiSelect';

export default function ReportFormPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const reportId = params.reportId ? BigInt(params.reportId) : null;
  const isEditMode = !!reportId;

  const { data: existingReport, isLoading: reportLoading } = useGetReport(reportId || BigInt(0));
  const { data: categories = [] } = useGetCategories();
  const { data: accounts = [] } = useGetAccounts();
  const { data: tags = [] } = useGetTags();
  const createReportMutation = useCreateReport();
  const updateReportMutation = useUpdateReport();

  const [reportType, setReportType] = useState<ReportType>(ReportType.incomeVsExpenses);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<bigint[]>([]);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (existingReport && isEditMode) {
      setReportType(existingReport.reportType);
      setStartDate(new Date(Number(existingReport.startDate)).toISOString().split('T')[0]);
      setEndDate(new Date(Number(existingReport.endDate)).toISOString().split('T')[0]);

      if (existingReport.filters) {
        try {
          const filters = JSON.parse(existingReport.filters);
          if (filters.categoryId) setSelectedCategoryId(filters.categoryId);
          if (filters.accountId) setSelectedAccountId(filters.accountId);
          if (filters.tagIds) setSelectedTagIds(filters.tagIds.map((id: string) => BigInt(id)));
        } catch (e) {
          console.error('Failed to parse filters:', e);
        }
      }
    }
  }, [existingReport, isEditMode]);

  const validateDates = () => {
    if (!startDate || !endDate) {
      setValidationError('Please select both start and end dates');
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setValidationError('End date must be after start date');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateDates()) return;

    const filters = {
      categoryId: selectedCategoryId || undefined,
      accountId: selectedAccountId || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds.map((id) => id.toString()) : undefined,
    };

    const filtersJson = JSON.stringify(filters);
    const startTimestamp = BigInt(new Date(startDate).getTime());
    const endTimestamp = BigInt(new Date(endDate).getTime());

    try {
      if (isEditMode && reportId) {
        await updateReportMutation.mutateAsync({
          reportId,
          reportType,
          startDate: startTimestamp,
          endDate: endTimestamp,
          filters: filtersJson,
        });
        toast.success('Report updated successfully');
        navigate({ to: `/reports/${reportId}` });
      } else {
        const newReportId = await createReportMutation.mutateAsync({
          reportType,
          startDate: startTimestamp,
          endDate: endTimestamp,
          filters: filtersJson,
        });
        toast.success('Report created successfully');
        navigate({ to: `/reports/${newReportId}` });
      }
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update report' : 'Failed to create report');
      console.error('Save error:', error);
    }
  };

  const handleDownloadPreview = async () => {
    if (!validateDates()) return;

    const previewReport = {
      id: BigInt(0),
      name: `${getReportTypeName(reportType)} Preview`,
      reportType,
      startDate: BigInt(new Date(startDate).getTime()),
      endDate: BigInt(new Date(endDate).getTime()),
      filters: undefined,
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    };

    try {
      await downloadReportPdf(previewReport, null);
      toast.success('Preview downloaded successfully');
    } catch (error) {
      toast.error('Failed to download preview');
      console.error('Download error:', error);
    }
  };

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

  const isSaving = createReportMutation.isPending || updateReportMutation.isPending;

  if (isEditMode && reportLoading) {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Report' : 'Create New Report'}</h1>
          <p className="text-muted-foreground">Configure your financial report</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '/reports' })}>
            Cancel
          </Button>
          <Button onClick={handleDownloadPreview} variant="outline" className="gap-2" disabled={!startDate || !endDate}>
            <Download className="h-4 w-4" />
            Download Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Report
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>Select report type and date range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                <SelectTrigger id="reportType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReportType.incomeVsExpenses}>Income vs. Expenses</SelectItem>
                  <SelectItem value={ReportType.categoryBreakdown}>Category Breakdown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setValidationError('');
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setValidationError('');
                }}
              />
            </div>

            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3">Optional Filters</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id.toString()} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">Account</Label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger id="account">
                      <SelectValue placeholder="All accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All accounts</SelectItem>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id.toString()} value={acc.id.toString()}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <TagMultiSelect
                    tags={tags}
                    selectedTagIds={selectedTagIds}
                    onSelectedChange={setSelectedTagIds}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Live preview of your report</CardDescription>
          </CardHeader>
          <CardContent>
            {!startDate || !endDate ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Select dates to see a preview</p>
              </div>
            ) : (
              <ReportResultsView
                reportType={reportType}
                startDate={BigInt(new Date(startDate).getTime())}
                endDate={BigInt(new Date(endDate).getTime())}
                filters={null}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
