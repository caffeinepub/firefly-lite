import Map "mo:core/Map";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Float "mo:core/Float";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Authorization - Guest users must be authorized to persist data
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type AccountId = Nat;
  type CategoryId = Nat;
  type TransactionId = Nat;

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

  public type UserProfile = {
    name : Text;
  };

  // Budget types
  type BudgetId = Nat;

  public type BudgetCategoryLimit = {
    categoryId : CategoryId;
    limitAmount : Float;
  };

  public type Budget = {
    id : BudgetId;
    month : Int; // YYYYMM format (e.g. 202304)
    categoryLimits : [BudgetCategoryLimit];
    carryOver : Float; // Amount carried over from previous month
  };

  // Persistent state
  var accounts = Map.empty<Principal, Map.Map<AccountId, Account>>();
  var categories = Map.empty<Principal, Map.Map<CategoryId, Category>>();
  var transactions = Map.empty<Principal, Map.Map<TransactionId, Transaction>>();
  var userProfiles = Map.empty<Principal, UserProfile>();
  var budgets = Map.empty<Principal, Map.Map<Nat, Budget>>(); // Nested map for budgets per user

  var nextAccountId = 1;
  var nextCategoryId = 1;
  var nextTransactionId = 1;
  var nextBudgetId = 1;

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Account management
  public shared ({ caller }) func createAccount(name : Text) : async AccountId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create accounts");
    };
    let accountId = nextAccountId;
    nextAccountId += 1;

    let account : Account = {
      id = accountId;
      name;
      balance = 0.0;
    };

    let userAccounts = switch (accounts.get(caller)) {
      case (null) { Map.empty<AccountId, Account>() };
      case (?existing) { existing };
    };
    userAccounts.add(accountId, account);
    accounts.add(caller, userAccounts);

    accountId;
  };

  public query ({ caller }) func getAccounts() : async [Account] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access accounts");
    };
    switch (accounts.get(caller)) {
      case (null) { [] };
      case (?userAccounts) { userAccounts.values().toArray() };
    };
  };

  // Category management
  public shared ({ caller }) func createCategory(name : Text, isExpense : Bool) : async CategoryId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create categories");
    };
    let categoryId = nextCategoryId;
    nextCategoryId += 1;

    let category : Category = {
      id = categoryId;
      name;
      isExpense;
    };

    let userCategories = switch (categories.get(caller)) {
      case (null) { Map.empty<CategoryId, Category>() };
      case (?existing) { existing };
    };
    userCategories.add(categoryId, category);
    categories.add(caller, userCategories);

    categoryId;
  };

  public query ({ caller }) func getCategories() : async [Category] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access categories");
    };
    switch (categories.get(caller)) {
      case (null) { [] };
      case (?userCategories) { userCategories.values().toArray() };
    };
  };

  // Transaction management
  public shared ({ caller }) func createTransaction(accountId : AccountId, categoryId : CategoryId, amount : Float, date : Int) : async TransactionId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create transactions");
    };
    let transactionId = nextTransactionId;
    nextTransactionId += 1;

    // Verify account ownership
    let userAccounts = switch (accounts.get(caller)) {
      case (null) {
        Runtime.trap("Account not found");
      };
      case (?userAccounts) { userAccounts };
    };
    let mutAccount = switch (userAccounts.get(accountId)) {
      case (null) {
        Runtime.trap("Account not found or does not belong to caller");
      };
      case (?account) { account };
    };

    // Verify category ownership
    let userCategories = switch (categories.get(caller)) {
      case (null) {
        Runtime.trap("Category not found or does not belong to caller");
      };
      case (?userCategories) { userCategories };
    };
    switch (userCategories.get(categoryId)) {
      case (null) {
        Runtime.trap("Category not found or does not belong to caller");
      };
      case (?_) {};
    };

    let transaction : Transaction = {
      id = transactionId;
      accountId;
      categoryId;
      amount;
      date;
    };

    // Update account balance
    let updatedAccount : Account = {
      id = mutAccount.id;
      name = mutAccount.name;
      balance = mutAccount.balance + amount;
    };
    userAccounts.add(accountId, updatedAccount);

    // Add transaction
    let userTransactions = switch (transactions.get(caller)) {
      case (null) { Map.empty<TransactionId, Transaction>() };
      case (?existing) { existing };
    };
    userTransactions.add(transactionId, transaction);
    transactions.add(caller, userTransactions);

    transactionId;
  };

  module Transaction {
    public func compareByDate(t1 : Transaction, t2 : Transaction) : Order.Order {
      Int.compare(t1.date, t2.date);
    };
  };

  public query ({ caller }) func getTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access transactions");
    };
    switch (transactions.get(caller)) {
      case (null) { [] };
      case (?userTransactions) { userTransactions.values().toArray() };
    };
  };

  public query ({ caller }) func getTransactionsByDateRange(startDate : Int, endDate : Int) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access transactions");
    };
    switch (transactions.get(caller)) {
      case (null) { [] };
      case (?userTransactions) {
        let filtered = List.empty<Transaction>();
        userTransactions.values().forEach(
          func(t) {
            if (t.date >= startDate and t.date <= endDate) {
              filtered.add(t);
            };
          }
        );
        filtered.toArray().sort(Transaction.compareByDate);
      };
    };
  };

  /////////////////////////////////////////////////////////////////
  // Budget Management

  public shared ({ caller }) func createBudget(month : Int, categoryLimits : [BudgetCategoryLimit], carryOver : Float) : async BudgetId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create budgets");
    };

    // Verify all categories in categoryLimits belong to caller
    let userCategories = switch (categories.get(caller)) {
      case (null) {
        if (categoryLimits.size() > 0) {
          Runtime.trap("Categories not found or do not belong to caller");
        };
        Map.empty<CategoryId, Category>();
      };
      case (?existing) { existing };
    };

    for (limit in categoryLimits.values()) {
      switch (userCategories.get(limit.categoryId)) {
        case (null) {
          Runtime.trap("Category not found or does not belong to caller");
        };
        case (?_) {};
      };
    };

    let budgetId = nextBudgetId;
    nextBudgetId += 1;

    let budget : Budget = {
      id = budgetId;
      month;
      categoryLimits;
      carryOver;
    };

    let userBudgets = switch (budgets.get(caller)) {
      case (null) { Map.empty<BudgetId, Budget>() };
      case (?existing) { existing };
    };
    userBudgets.add(budgetId, budget);
    budgets.add(caller, userBudgets);

    budgetId;
  };

  public query ({ caller }) func getBudgets() : async [Budget] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access budgets");
    };
    switch (budgets.get(caller)) {
      case (null) { [] };
      case (?userBudgets) { userBudgets.values().toArray() };
    };
  };

  public query ({ caller }) func getBudget(budgetId : BudgetId) : async ?Budget {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access budgets");
    };
    switch (budgets.get(caller)) {
      case (null) { null };
      case (?userBudgets) { userBudgets.get(budgetId) };
    };
  };

  public shared ({ caller }) func updateBudget(budgetId : BudgetId, month : Int, categoryLimits : [BudgetCategoryLimit], carryOver : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update budgets");
    };

    let userBudgets = switch (budgets.get(caller)) {
      case (null) {
        Runtime.trap("Budget not found or does not belong to caller");
      };
      case (?userBudgets) { userBudgets };
    };

    switch (userBudgets.get(budgetId)) {
      case (null) {
        Runtime.trap("Budget not found or does not belong to caller");
      };
      case (?_) {};
    };

    // Verify all categories in categoryLimits belong to caller
    let userCategories = switch (categories.get(caller)) {
      case (null) {
        if (categoryLimits.size() > 0) {
          Runtime.trap("Categories not found or do not belong to caller");
        };
        Map.empty<CategoryId, Category>();
      };
      case (?existing) { existing };
    };

    for (limit in categoryLimits.values()) {
      switch (userCategories.get(limit.categoryId)) {
        case (null) {
          Runtime.trap("Category not found or does not belong to caller");
        };
        case (?_) {};
      };
    };

    let updatedBudget : Budget = {
      id = budgetId;
      month;
      categoryLimits;
      carryOver;
    };
    userBudgets.add(budgetId, updatedBudget);
  };

  public shared ({ caller }) func deleteBudget(budgetId : BudgetId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete budgets");
    };

    let userBudgets = switch (budgets.get(caller)) {
      case (null) {
        Runtime.trap("Budget not found or does not belong to caller");
      };
      case (?userBudgets) { userBudgets };
    };

    switch (userBudgets.get(budgetId)) {
      case (null) {
        Runtime.trap("Budget not found or does not belong to caller");
      };
      case (?_) {
        userBudgets.remove(budgetId);
      };
    };
  };

  public type BudgetSummary = {
    month : Int;
    totalIncomeBudget : Float;
    totalExpenseBudget : Float;
    actualIncome : Float;
    actualExpenses : Float;
    remainingIncomeBudget : Float;
    remainingExpenseBudget : Float;
  };

  public query ({ caller }) func getBudgetSummary(month : Int) : async BudgetSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access budget summaries");
    };

    // Find budget for the month - verify it belongs to caller
    let budget = switch (budgets.get(caller)) {
      case (null) {
        Runtime.trap("Budget not found or does not belong to caller");
      };
      case (?userBudgets) {
        for ((_, b) in userBudgets.entries()) {
          if (b.month == month) {
            return generateBudgetSummary(caller, b, month);
          };
        };
        Runtime.trap("Budget not found for specified month");
      };
    };
  };

  // Helper function to generate budget summary
  func generateBudgetSummary(caller : Principal, budget : Budget, month : Int) : BudgetSummary {
    // Calculate totals
    var totalIncomeBudget = 0.0;
    var totalExpenseBudget = 0.0;
    for (limit in budget.categoryLimits.values()) {
      let category = switch (categories.get(caller)) {
        case (null) { null };
        case (?userCategories) { userCategories.get(limit.categoryId) };
      };
      switch (category) {
        case (?cat) {
          if (cat.isExpense) {
            totalExpenseBudget += limit.limitAmount;
          } else {
            totalIncomeBudget += limit.limitAmount;
          };
        };
        case (null) {};
      };
    };

    // Calculate actuals
    var actualIncome = 0.0;
    var actualExpenses = 0.0;
    switch (transactions.get(caller)) {
      case (null) {};
      case (?userTransactions) {
        for ((_, t) in userTransactions.entries()) {
          if (getTransactionMonth(t.date) == month) {
            let category = switch (categories.get(caller)) {
              case (null) { null };
              case (?userCategories) { userCategories.get(t.categoryId) };
            };
            switch (category) {
              case (?cat) {
                if (cat.isExpense) {
                  actualExpenses += t.amount;
                } else {
                  actualIncome += t.amount;
                };
              };
              case (null) {};
            };
          };
        };
      };
    };

    let remainingIncomeBudget = totalIncomeBudget - actualIncome;
    let remainingExpenseBudget = totalExpenseBudget - actualExpenses;

    {
      month;
      totalIncomeBudget;
      totalExpenseBudget;
      actualIncome;
      actualExpenses;
      remainingIncomeBudget;
      remainingExpenseBudget;
    };
  };

  func getTransactionMonth(timestampMillis : Int) : Int {
    let timestampFloat = timestampMillis.toFloat();
    let seconds = timestampFloat / 1000.0;
    let days = seconds / (60.0 * 60.0 * 24.0);
    let months = days / 30.0;
    let timestamp = months.toInt() + 197001;
    let year = timestamp / 12;
    let month = timestamp % 12;
    year * 100 + month;
  };
};
