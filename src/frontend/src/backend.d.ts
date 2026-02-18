import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Budget {
    id: BudgetId;
    month: bigint;
    carryOver: number;
    categoryLimits: Array<BudgetCategoryLimit>;
}
export interface Account {
    id: AccountId;
    balance: number;
    name: string;
}
export type BudgetId = bigint;
export interface BudgetCategoryLimit {
    categoryId: CategoryId;
    limitAmount: number;
}
export type BankConnectionId = bigint;
export interface Report {
    id: bigint;
    filters?: string;
    endDate: bigint;
    name: string;
    createdAt: bigint;
    reportType: ReportType;
    updatedAt: bigint;
    startDate: bigint;
}
export interface Transaction {
    id: TransactionId;
    categoryId: CategoryId;
    accountId: AccountId;
    date: bigint;
    tags: Array<TagId>;
    amount: number;
}
export type BankConnectionStatus = {
    __kind__: "syncError";
    syncError: {
        error: string;
        timestamp: bigint;
    };
} | {
    __kind__: "idle";
    idle: null;
} | {
    __kind__: "lastSynced";
    lastSynced: {
        timestamp: bigint;
    };
} | {
    __kind__: "inProgress";
    inProgress: null;
};
export type TagId = bigint;
export type TransactionId = bigint;
export interface Tag {
    id: TagId;
    name: string;
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
export interface CsvTransactionRow {
    categoryId: CategoryId;
    accountId: AccountId;
    date: bigint;
    tagIds: Array<TagId>;
    amount: number;
}
export interface BankConnection {
    id: BankConnectionId;
    status: BankConnectionStatus;
    name: string;
    connectionType: string;
    nextSyncTimestamp?: bigint;
    createdTimestamp: bigint;
    lastSync?: bigint;
    retryAttempts: bigint;
}
export type AccountId = bigint;
export type CategoryId = bigint;
export interface Category {
    id: CategoryId;
    isExpense: boolean;
    name: string;
}
export interface UserProfile {
    name: string;
}
export enum ReportType {
    categoryBreakdown = "categoryBreakdown",
    incomeVsExpenses = "incomeVsExpenses"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAccount(name: string): Promise<AccountId>;
    createBankConnection(name: string, connectionType: string): Promise<BankConnectionId>;
    createBudget(month: bigint, categoryLimits: Array<BudgetCategoryLimit>, carryOver: number): Promise<BudgetId>;
    createCategory(name: string, isExpense: boolean): Promise<CategoryId>;
    createReport(reportType: ReportType, startDate: bigint, endDate: bigint, filters: string | null): Promise<bigint>;
    createTag(name: string): Promise<TagId>;
    createTransaction(accountId: AccountId, categoryId: CategoryId, amount: number, date: bigint, tagIds: Array<TagId>): Promise<TransactionId>;
    createTransactionsFromCsvRows(csvTransactions: Array<CsvTransactionRow>): Promise<Array<TransactionId>>;
    deleteBankConnection(bankConnectionId: BankConnectionId): Promise<void>;
    deleteBudget(budgetId: BudgetId): Promise<void>;
    deleteReport(reportId: bigint): Promise<void>;
    deleteTag(tagId: TagId): Promise<void>;
    getAccounts(): Promise<Array<Account>>;
    getBankConnection(bankConnectionId: BankConnectionId): Promise<BankConnection | null>;
    getBankConnections(): Promise<Array<BankConnection>>;
    getBudget(budgetId: BudgetId): Promise<Budget | null>;
    getBudgetSummary(month: bigint): Promise<BudgetSummary>;
    getBudgets(): Promise<Array<Budget>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<Category>>;
    getReport(reportId: bigint): Promise<Report | null>;
    getReports(): Promise<Array<Report>>;
    getTags(): Promise<Array<Tag>>;
    getTransactions(): Promise<Array<Transaction>>;
    getTransactionsByDateRange(startDate: bigint, endDate: bigint): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listReports(): Promise<Array<Report>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    syncBankConnection(bankConnectionId: BankConnectionId): Promise<void>;
    updateBankConnectionSyncStatus(bankConnectionId: BankConnectionId, newStatus: BankConnectionStatus): Promise<void>;
    updateBudget(budgetId: BudgetId, month: bigint, categoryLimits: Array<BudgetCategoryLimit>, carryOver: number): Promise<void>;
    updateReport(reportId: bigint, reportType: ReportType, startDate: bigint, endDate: bigint, filters: string | null): Promise<void>;
}
