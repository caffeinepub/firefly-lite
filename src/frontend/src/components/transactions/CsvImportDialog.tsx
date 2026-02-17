import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Upload, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { parseCsvFile, validateCsvRow, type CsvRow, type CsvValidationResult } from '../../utils/transactionsCsv';
import { useGetAccounts, useGetCategories, useGetTags } from '../../hooks/useFinanceQueries';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: CsvRow[]) => Promise<{ created: number; failed: number; errors: string[] }>;
}

export default function CsvImportDialog({ open, onOpenChange, onImport }: CsvImportDialogProps) {
  const { data: accounts = [] } = useGetAccounts();
  const { data: categories = [] } = useGetCategories();
  const { data: tags = [] } = useGetTags();

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);
  const [validationResults, setValidationResults] = useState<CsvValidationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    try {
      const rows = await parseCsvFile(selectedFile);
      setParsedRows(rows);

      const results = rows.map((row, index) =>
        validateCsvRow(row, index, accounts, categories, tags)
      );
      setValidationResults(results);
    } catch (error: any) {
      alert(error.message || 'Failed to parse CSV file');
      setFile(null);
      setParsedRows([]);
      setValidationResults([]);
    }
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter((_, index) => validationResults[index].isValid);
    if (validRows.length === 0) return;

    setIsProcessing(true);
    try {
      const result = await onImport(validRows);
      setImportResult(result);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedRows([]);
    setValidationResults([]);
    setImportResult(null);
    onOpenChange(false);
  };

  const validCount = validationResults.filter((r) => r.isValid).length;
  const invalidCount = validationResults.filter((r) => !r.isValid).length;
  const hasValidRows = validCount > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Transactions from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with transaction data. Required columns: date, accountName, categoryName, amount
          </DialogDescription>
        </DialogHeader>

        {!importResult ? (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div>
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-2"
              />
            </div>

            {parsedRows.length > 0 && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Found {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''}: {validCount} valid, {invalidCount} invalid
                  </AlertDescription>
                </Alert>

                <ScrollArea className="flex-1 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row, index) => {
                        const validation = validationResults[index];
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              {validation.isValid ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive" />
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{row.date}</TableCell>
                            <TableCell className="text-sm">{row.accountName}</TableCell>
                            <TableCell className="text-sm">{row.categoryName}</TableCell>
                            <TableCell className="text-sm">{row.amount}</TableCell>
                            <TableCell className="text-sm">{row.tags || '—'}</TableCell>
                            <TableCell className="text-sm text-destructive">
                              {validation.errors.join(', ')}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Import completed: {importResult.created} transaction{importResult.created !== 1 ? 's' : ''} created
                {importResult.failed > 0 && `, ${importResult.failed} failed`}
              </AlertDescription>
            </Alert>

            {importResult.errors.length > 0 && (
              <ScrollArea className="h-[200px] border rounded-md p-4">
                <div className="space-y-2">
                  {importResult.errors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">
                      {error}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        <DialogFooter>
          {!importResult ? (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!hasValidRows || isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import {validCount} Transaction{validCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
