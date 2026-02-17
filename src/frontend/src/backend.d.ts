import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Transaction {
    id: TransactionId;
    categoryId: CategoryId;
    accountId: AccountId;
    date: bigint;
    amount: number;
}
export interface BudgetSummary {
    month: bigint;
    totalIncomeBudget: number;
    actualIncome: number;
    actualExpenses: number;
    remainingIncomeBudget: number;
    totalExpenseBudget: number;
    remainingExpenseBudget: number;
}
export type TransactionId = bigint;
export type BudgetId = bigint;
export interface BudgetCategoryLimit {
    categoryId: CategoryId;
    limitAmount: number;
}
export interface Budget {
    id: BudgetId;
    month: bigint;
    carryOver: number;
    categoryLimits: Array<BudgetCategoryLimit>;
}
export type AccountId = bigint;
export interface Account {
    id: AccountId;
    balance: number;
    name: string;
}
export type CategoryId = bigint;
export interface Category {
    id: CategoryId;
    isExpense: boolean;
    name: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAccount(name: string): Promise<AccountId>;
    createBudget(month: bigint, categoryLimits: Array<BudgetCategoryLimit>, carryOver: number): Promise<BudgetId>;
    createCategory(name: string, isExpense: boolean): Promise<CategoryId>;
    createTransaction(accountId: AccountId, categoryId: CategoryId, amount: number, date: bigint): Promise<TransactionId>;
    deleteBudget(budgetId: BudgetId): Promise<void>;
    getAccounts(): Promise<Array<Account>>;
    getBudget(budgetId: BudgetId): Promise<Budget | null>;
    getBudgetSummary(month: bigint): Promise<BudgetSummary>;
    getBudgets(): Promise<Array<Budget>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<Category>>;
    getTransactions(): Promise<Array<Transaction>>;
    getTransactionsByDateRange(startDate: bigint, endDate: bigint): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBudget(budgetId: BudgetId, month: bigint, categoryLimits: Array<BudgetCategoryLimit>, carryOver: number): Promise<void>;
}
