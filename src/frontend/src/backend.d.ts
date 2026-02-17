import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
}
export interface Transaction {
    id: TransactionId;
    categoryId: CategoryId;
    accountId: AccountId;
    date: bigint;
    amount: number;
}
export type TransactionId = bigint;
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
export type AccountId = bigint;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAccount(name: string): Promise<AccountId>;
    createCategory(name: string, isExpense: boolean): Promise<CategoryId>;
    createTransaction(accountId: AccountId, categoryId: CategoryId, amount: number, date: bigint): Promise<TransactionId>;
    getAccounts(): Promise<Array<Account>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<Category>>;
    getTransactions(): Promise<Array<Transaction>>;
    getTransactionsByDateRange(startDate: bigint, endDate: bigint): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
