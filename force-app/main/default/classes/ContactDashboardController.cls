public with sharing class ContactDashboardController {
  @AuraEnabled(cacheable=true)
  public static List<Account> getAccountsWithContacts() {
    return [
      SELECT Id, Name
      FROM ACCOUNT
      WHERE Id IN (SELECT AccountId FROM Contact WHERE AccountId != NULL)
      WITH USER_MODE
    ];
  }

  @AuraEnabled(cacheable=true)
  public static List<Contact> getContacts(
    String searchStr,
    String accountId,
    String territory
  ) {
    String baseQuery = 'SELECT Id, Name, Email, Phone, Territory__c, Gender__c FROM Contact ';
    if (!String.isBlank(searchStr)) {
      String searchKey = '%' + searchStr + '%';
      baseQuery += ' WHERE Name LIKE : searchKey ';
    }
    if (accountId != 'All Accounts') {
      if (baseQuery.contains('WHERE')) {
        baseQuery += ' AND AccountId =: accountId ';
      } else {
        baseQuery += ' WHERE AccountId =: accountId ';
      }
    }
    if (territory != 'All Territories') {
      if (baseQuery.contains('WHERE')) {
        baseQuery += ' AND Territory__c =: territory ';
      } else {
        baseQuery += ' WHERE Territory__c =: territory ';
      }
    }
    return Database.query(baseQuery, AccessLevel.USER_MODE);
  }

  @AuraEnabled(cacheable=true)
  public static List<TerritoryCount> getTerritoryStats() {
    List<AggregateResult> arList = [
      SELECT Territory__c, count(Id) cnt
      FROM Contact
      WHERE Territory__c != NULL
      WITH USER_MODE
      GROUP BY Territory__c
    ];
    final List<TerritoryCount> terrList = new List<TerritoryCount>();
    for (AggregateResult ar : arList) {
      TerritoryCount terr = new TerritoryCount();
      terr.territoryName = (String) ar.get('Territory__c');
      terr.contactCount = (Integer) ar.get('cnt');
      terrList.add(terr);
    }
    return terrList;
  }

  public class TerritoryCount {
    @AuraEnabled
    public String territoryName;
    @AuraEnabled
    public Integer contactCount;
  }
}