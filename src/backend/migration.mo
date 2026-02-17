import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
  type AccountId = Nat;
  type CategoryId = Nat;
  type TransactionId = Nat;
  type BudgetId = Nat;

  type Account = {
    id : AccountId;
    name : Text;
    balance : Float;
  };

  type Category = {
    id : CategoryId;
    name : Text;
    isExpense : Bool;
  };

  type Transaction = {
    id : TransactionId;
    accountId : AccountId;
    categoryId : CategoryId;
    amount : Float;
    date : Int;
  };

  type UserProfile = {
    name : Text;
  };

  // Legacy actor type (pre-budgets)
  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    accounts : Map.Map<Principal, Map.Map<AccountId, Account>>;
    categories : Map.Map<Principal, Map.Map<CategoryId, Category>>;
    transactions : Map.Map<Principal, Map.Map<TransactionId, Transaction>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    nextAccountId : Nat;
    nextCategoryId : Nat;
    nextTransactionId : Nat;
  };

  // Budget types
  type BudgetCategoryLimit = {
    categoryId : CategoryId;
    limitAmount : Float;
  };

  type Budget = {
    id : BudgetId;
    month : Int;
    categoryLimits : [BudgetCategoryLimit];
    carryOver : Float;
  };

  // New actor type (with budgets)
  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    accounts : Map.Map<Principal, Map.Map<AccountId, Account>>;
    categories : Map.Map<Principal, Map.Map<CategoryId, Category>>;
    transactions : Map.Map<Principal, Map.Map<TransactionId, Transaction>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    budgets : Map.Map<Principal, Map.Map<BudgetId, Budget>>;
    nextAccountId : Nat;
    nextCategoryId : Nat;
    nextTransactionId : Nat;
    nextBudgetId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      budgets = Map.empty<Principal, Map.Map<BudgetId, Budget>>();
      nextBudgetId = 1;
    };
  };
};
