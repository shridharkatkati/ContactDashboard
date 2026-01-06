import { LightningElement, wire, api } from "lwc";
import getAccountsWithContacts from "@salesforce/apex/ContactDashboardController.getAccountsWithContacts";
// import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
// import TERRITORY from "@salesforce/schema/Contact.Territory__c";
// import OBJ_CONTACT from "@salesforce/schema/Contact";
const DELAY = 300;
export default class ContactDashboardFilters extends LightningElement {
  // combo box options ---------------------------------------------------------------------------
  accountOptions = [{ label: "All Accounts", value: "All Accounts" }];
  @api terrOptions;
  // all input values for all components--------------------------------------------------------
  contactFilter = "";
  selectedAccount = "All Accounts";
  selectedTerritory = "All Territories";

  // timers for debouncing----------------------------------------------------------------------
  timer;

  // wired methods and variables--------------------------------------------------------------
  @wire(getAccountsWithContacts) accounts({ data, error }) {
    if (data) {
      let accArr = data.map((acc) => {
        return { label: acc.Name, value: acc.Id };
      });
      this.accountOptions = [...this.accountOptions, ...accArr];
    } else if (error) {
      console.log("error: ", error);
    }
  }

  //  handler methods----------------------------------------------------------------------------
  resetSearch() {
    this.contactFilter = "";
  }
  filterContacts(event) {
    clearTimeout(this.timer);
    let { value } = event.target;
    this.timer = setTimeout(() => {
      this.contactFilter = value;
      let event = new CustomEvent("filterchange", {
        detail: {
          searchTerm: this.contactFilter,
          accountId: this.selectedAccount,
          territory: this.selectedTerritory
        }
      });
      this.dispatchEvent(event);
    }, DELAY);
  }

  handleAccountChange(event) {
    let { value } = event.target;
    this.selectedAccount = value;
    let custEvent = new CustomEvent("filterchange", {
      detail: {
        searchTerm: this.contactFilter,
        accountId: this.selectedAccount,
        territory: this.selectedTerritory
      }
    });
    this.dispatchEvent(custEvent);
  }

  handleTerritoryChange(event) {
    let { value } = event.target;
    this.selectedTerritory = value;
    let custEvent = new CustomEvent("filterchange", {
      detail: {
        searchTerm: this.contactFilter,
        accountId: this.selectedAccount,
        territory: this.selectedTerritory
      }
    });
    this.dispatchEvent(custEvent);
  }

  handleNewContact() {
    let custEvent = new CustomEvent("newcontact", {
      detail: { newContact: true }
    });
    this.dispatchEvent(custEvent);
    console.log("new contact clicked");
  }

  // getters and setters----------------------------------------------------------------------------
  get getTerritoryOptions() {
    return this.terrOptions;
  }
}