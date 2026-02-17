import type { Account, Category, Tag, Transaction, TagId } from '../backend';

export interface CsvRow {
  date: string;
  accountName: string;
  categoryName: string;
  amount: string;
  tags?: string;
}

export interface CsvValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Parse a CSV file and return an array of rows
 */
export async function parseCsvFile(file: File): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCsvText(text);
        resolve(rows);
      } catch (error: any) {
        reject(new Error(error.message || 'Failed to parse CSV'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Parse CSV text into rows
 */
function parseCsvText(text: string): CsvRow[] {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row');
  }

  const header = parseCsvLine(lines[0]);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0) continue;

    const row: any = {};
    header.forEach((key, index) => {
      row[key.trim().toLowerCase()] = values[index]?.trim() || '';
    });

    rows.push({
      date: row.date || '',
      accountName: row.accountname || row.account || '',
      categoryName: row.categoryname || row.category || '',
      amount: row.amount || '',
      tags: row.tags || '',
    });
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Validate a CSV row
 */
export function validateCsvRow(
  row: CsvRow,
  index: number,
  accounts: Account[],
  categories: Category[],
  tags: Tag[]
): CsvValidationResult {
  const errors: string[] = [];

  // Validate date
  if (!row.date) {
    errors.push('Date is required');
  } else {
    const date = new Date(row.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }

  // Validate account
  if (!row.accountName) {
    errors.push('Account name is required');
  } else {
    const account = accounts.find((a) => a.name.toLowerCase() === row.accountName.toLowerCase());
    if (!account) {
      errors.push(`Account "${row.accountName}" not found`);
    }
  }

  // Validate category
  if (!row.categoryName) {
    errors.push('Category name is required');
  } else {
    const category = categories.find((c) => c.name.toLowerCase() === row.categoryName.toLowerCase());
    if (!category) {
      errors.push(`Category "${row.categoryName}" not found`);
    }
  }

  // Validate amount
  if (!row.amount) {
    errors.push('Amount is required');
  } else {
    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount === 0) {
      errors.push('Invalid amount');
    }
  }

  // Validate tags (optional)
  if (row.tags) {
    const tagNames = row.tags.split(',').map((t) => t.trim()).filter(Boolean);
    for (const tagName of tagNames) {
      const tag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
      if (!tag) {
        errors.push(`Tag "${tagName}" not found`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Export transactions to CSV format
 */
export function exportTransactionsToCsv(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  tags: Tag[]
): string {
  const header = 'transactionId,date,accountId,accountName,categoryId,categoryName,amount,tags\n';

  const rows = transactions.map((transaction) => {
    const account = accounts.find((a) => a.id === transaction.accountId);
    const category = categories.find((c) => c.id === transaction.categoryId);
    const transactionTags = tags
      .filter((tag) => transaction.tags.some((id) => id === tag.id))
      .map((tag) => tag.name)
      .join(',');

    const date = new Date(Number(transaction.date)).toISOString().split('T')[0];

    return [
      transaction.id.toString(),
      date,
      transaction.accountId.toString(),
      escapeCsvValue(account?.name || 'Unknown'),
      transaction.categoryId.toString(),
      escapeCsvValue(category?.name || 'Unknown'),
      transaction.amount.toString(),
      escapeCsvValue(transactionTags),
    ].join(',');
  });

  return header + rows.join('\n');
}

/**
 * Escape a CSV value (add quotes if needed)
 */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download a CSV file in the browser
 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
