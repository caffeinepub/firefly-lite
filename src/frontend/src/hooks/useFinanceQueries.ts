import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Account, Category, Transaction, UserProfile, AccountId, CategoryId, Budget, BudgetId, BudgetCategoryLimit, BudgetSummary } from '../backend';

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
    }: {
      accountId: AccountId;
      categoryId: CategoryId;
      amount: number;
      date: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTransaction(accountId, categoryId, amount, date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
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
