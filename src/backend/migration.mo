import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Principal "mo:core/Principal";

module {
  // Types in the old version (without bank connections)
  type OldActor = {
    accounts : Map.Map<Principal, Map.Map<Nat, {
      id : Nat;
      name : Text;
      balance : Float.Float;
    }>>;
    categories : Map.Map<Principal, Map.Map<Nat, {
      id : Nat;
      name : Text;
      isExpense : Bool;
    }>>;
    transactions : Map.Map<Principal, Map.Map<Nat, {
      id : Nat;
      accountId : Nat;
      categoryId : Nat;
      amount : Float.Float;
      date : Int;
      tags : [Nat];
    }>>;
    tags : Map.Map<Principal, Map.Map<Nat, { id : Nat; name : Text }>>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    budgets : Map.Map<Principal, Map.Map<Nat, {
      id : Nat;
      month : Int;
      categoryLimits : [{
        categoryId : Nat;
        limitAmount : Float.Float;
      }];
      carryOver : Float.Float;
    }>>;
    nextAccountId : Nat;
    nextCategoryId : Nat;
    nextTransactionId : Nat;
    nextBudgetId : Nat;
    nextTagId : Nat;
  };

  // Types in the new version (with bank connections)
  type NewActor = {
    accounts : Map.Map<Principal, Map.Map<Nat, {
      id : Nat;
      name : Text;
      balance : Float.Float;
    }>>;
    categories : Map.Map<Principal, Map.Map<Nat, {
      id : Nat;
      name : Text;
      isExpense : Bool;
    }>>;
    transactions : Map.Map<Principal, Map.Map<Nat, {
      id : Nat;
      accountId : Nat;
      categoryId : Nat;
      amount : Float.Float;
      date : Int;
      tags : [Nat];
    }>>;
    tags : Map.Map<Principal, Map.Map<Nat, { id : Nat; name : Text }>>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    budgets : Map.Map<Principal, Map.Map<Nat, {
      id : Nat;
      month : Int;
      categoryLimits : [{
        categoryId : Nat;
        limitAmount : Float.Float;
      }];
      carryOver : Float.Float;
    }>>;
    nextAccountId : Nat;
    nextCategoryId : Nat;
    nextTransactionId : Nat;
    nextBudgetId : Nat;
    nextTagId : Nat;
    bankConnections : Map.Map<Principal, Map.Map<Nat, {
      id : Nat;
      name : Text;
      connectionType : Text;
      status : {
        #idle;
        #inProgress;
        #lastSynced : { timestamp : Int };
        #syncError : { error : Text; timestamp : Int };
      };
      nextSyncTimestamp : ?Int;
      createdTimestamp : Int;
      lastSync : ?Int;
      retryAttempts : Nat;
    }>>;
    nextBankConnectionId : Nat;
  };

  // Migration function to add empty bank connections field
  public func run(old : OldActor) : NewActor {
    {
      old with
      bankConnections = Map.empty<Principal, Map.Map<Nat, {
        id : Nat;
        name : Text;
        connectionType : Text;
        status : {
          #idle;
          #inProgress;
          #lastSynced : { timestamp : Int };
          #syncError : { error : Text; timestamp : Int };
        };
        nextSyncTimestamp : ?Int;
        createdTimestamp : Int;
        lastSync : ?Int;
        retryAttempts : Nat;
      }>>();
      nextBankConnectionId = 1;
    };
  };
};
