import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Account, Category, Transaction, UserProfile, AccountId, CategoryId, Budget, BudgetId, BudgetCategoryLimit, BudgetSummary, Tag, TagId, TransactionId, BankConnection, BankConnectionId } from '../backend';

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

// Tag hooks
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

// Budget hooks
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

export function useGetBudget(budgetId: BudgetId | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Budget | null>({
    queryKey: ['budget', budgetId?.toString()],
    queryFn: async () => {
      if (!actor || !budgetId) return null;
      return actor.getBudget(budgetId);
    },
    enabled: !!actor && !actorFetching && !!budgetId,
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
        // Budget not found for this month is expected
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
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
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] });
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
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] });
    },
  });
}

export function useUpsertBudget() {
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
      
      // Check if budget exists for this month
      const budgets = await actor.getBudgets();
      const existingBudget = budgets.find((b) => b.month === month);
      
      if (existingBudget) {
        await actor.updateBudget(existingBudget.id, month, categoryLimits, carryOver);
        return existingBudget.id;
      } else {
        return actor.createBudget(month, categoryLimits, carryOver);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] });
    },
  });
}

// Bank connection hooks
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

export function useGetBankConnection(connectionId: BankConnectionId | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<BankConnection | null>({
    queryKey: ['bankConnection', connectionId?.toString()],
    queryFn: async () => {
      if (!actor || !connectionId) return null;
      return actor.getBankConnection(connectionId);
    },
    enabled: !!actor && !actorFetching && !!connectionId,
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
    mutationFn: async (connectionId: BankConnectionId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBankConnection(connectionId);
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
    mutationFn: async (connectionId: BankConnectionId) => {
      if (!actor) throw new Error('Actor not available');
      await actor.syncBankConnection(connectionId);
      
      // Poll for status updates
      const pollInterval = setInterval(async () => {
        const connection = await actor.getBankConnection(connectionId);
        if (connection && connection.status.__kind__ !== 'inProgress') {
          clearInterval(pollInterval);
          queryClient.invalidateQueries({ queryKey: ['bankConnections'] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['accounts'] });
          
          if (connection.status.__kind__ === 'lastSynced') {
            // Success notification will be shown by the component
          } else if (connection.status.__kind__ === 'syncError') {
            // Error notification will be shown by the component
          }
        }
      }, 2000);
      
      // Clear interval after 30 seconds to prevent infinite polling
      setTimeout(() => clearInterval(pollInterval), 30000);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankConnections'] });
    },
  });
}
