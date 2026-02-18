import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { 
  Account, Category, Transaction, UserProfile, AccountId, CategoryId, Budget, BudgetId, 
  BudgetCategoryLimit, BudgetSummary, Tag, TagId, TransactionId, BankConnection, 
  BankConnectionId, CsvTransactionRow, Report, ReportType
} from '../backend';
import type { 
  Invoice, InvoiceId, CreateInvoiceInput, UpdateInvoiceInput, InvoiceFilters 
} from '../types/invoice';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetAccounts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAccounts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateAccount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createAccount(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useGetCategories() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCategories();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, isExpense }: { name: string; isExpense: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCategory(name, isExpense);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useGetTransactions() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactions();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetTransactionsByDateRange(startDate: bigint, endDate: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['transactions', 'dateRange', startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactionsByDateRange(startDate, endDate);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      categoryId,
      amount,
      date,
      tagIds = [],
    }: {
      accountId: AccountId;
      categoryId: CategoryId;
      amount: number;
      date: bigint;
      tagIds?: TagId[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTransaction(accountId, categoryId, amount, date, tagIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useCreateTransactionsFromCsv() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (csvTransactions: CsvTransactionRow[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTransactionsFromCsvRows(csvTransactions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useGetBudgets() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBudgets();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetBudget(budgetId: BudgetId) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Budget | null>({
    queryKey: ['budgets', budgetId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBudget(budgetId);
    },
    enabled: !!actor && !actorFetching && budgetId > 0,
  });
}

export function useCreateBudget() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      month,
      categoryLimits,
      carryOver,
    }: {
      month: bigint;
      categoryLimits: BudgetCategoryLimit[];
      carryOver: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createBudget(month, categoryLimits, carryOver);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUpdateBudget() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      budgetId,
      month,
      categoryLimits,
      carryOver,
    }: {
      budgetId: BudgetId;
      month: bigint;
      categoryLimits: BudgetCategoryLimit[];
      carryOver: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBudget(budgetId, month, categoryLimits, carryOver);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.budgetId.toString()] });
    },
  });
}

export function useDeleteBudget() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetId: BudgetId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBudget(budgetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useGetBudgetSummary(month: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<BudgetSummary | null>({
    queryKey: ['budgetSummary', month.toString()],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getBudgetSummary(month);
      } catch (error) {
        console.error('Failed to get budget summary:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching && month > 0,
  });
}

export function useGetTags() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTags();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateTag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTag(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeleteTag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: TagId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTag(tagId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useGetBankConnections() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<BankConnection[]>({
    queryKey: ['bankConnections'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBankConnections();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetBankConnection(bankConnectionId: BankConnectionId) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<BankConnection | null>({
    queryKey: ['bankConnections', bankConnectionId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBankConnection(bankConnectionId);
    },
    enabled: !!actor && !actorFetching && bankConnectionId > 0,
  });
}

export function useCreateBankConnection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, connectionType }: { name: string; connectionType: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createBankConnection(name, connectionType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankConnections'] });
    },
  });
}

export function useDeleteBankConnection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bankConnectionId: BankConnectionId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBankConnection(bankConnectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankConnections'] });
    },
  });
}

export function useSyncBankConnection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bankConnectionId: BankConnectionId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.syncBankConnection(bankConnectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankConnections'] });
    },
  });
}

export function useGetReports() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listReports();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetReport(reportId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Report | null>({
    queryKey: ['reports', reportId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getReport(reportId);
    },
    enabled: !!actor && !actorFetching && reportId > 0,
  });
}

export function useCreateReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportType,
      startDate,
      endDate,
      filters,
    }: {
      reportType: ReportType;
      startDate: bigint;
      endDate: bigint;
      filters: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createReport(reportType, startDate, endDate, filters);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      reportType,
      startDate,
      endDate,
      filters,
    }: {
      reportId: bigint;
      reportType: ReportType;
      startDate: bigint;
      endDate: bigint;
      filters: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateReport(reportId, reportType, startDate, endDate, filters);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports', variables.reportId.toString()] });
    },
  });
}

export function useDeleteReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteReport(reportId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useGetInvoices() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      if (!actor) return [];
      return [];
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetInvoice(invoiceId: InvoiceId) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Invoice | null>({
    queryKey: ['invoices', invoiceId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return null;
    },
    enabled: !!actor && !actorFetching && invoiceId > 0,
  });
}

export function useCreateInvoice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Invoice creation not yet implemented in backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateInvoiceInput) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Invoice update not yet implemented in backend');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.invoiceId.toString()] });
    },
  });
}

export function useDeleteInvoice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: InvoiceId) => {
      if (!actor) throw new Error('Actor not available');
      throw new Error('Invoice deletion not yet implemented in backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
