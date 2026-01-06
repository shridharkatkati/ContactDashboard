import { LightningElement, wire, track } from "lwc";
import getContacts from "@salesforce/apex/ContactDashboardController.getContacts";
import getTerritoryStats from "@salesforce/apex/ContactDashboardController.getTerritoryStats";
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import { getRecord, deleteRecord } from "lightning/uiRecordApi";
import TERRITORY from "@salesforce/schema/Contact.Territory__c";
import OBJ_CONTACT from "@salesforce/schema/Contact";
import {
  subscribe,
  unsubscribe,
  MessageContext
} from "lightning/messageService";
import CONTACT_DASHBORD_MSG_CHANNEL from "@salesforce/messageChannel/contactDashboardMsgChannel__c";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import CONT_NAME from "@salesforce/schema/Contact.Name";
import CONT_TERRITORY from "@salesforce/schema/Contact.Territory__c";
import CONT_EMAIL from "@salesforce/schema/Contact.Email";
import CONT_PHONE from "@salesforce/schema/Contact.Phone";

export default class ContactDashboard extends NavigationMixin(
  LightningElement
) {
  searchTerm = "";
  accountId;
  territory;
  openModal;
  contactInfo;
  northCount;
  southCount;
  eastCount;
  westCount;
  msgTerritory;
  returnedContactId;

  filterTerritoryOptions = [
    { label: "All Territories", value: "All Territories" }
  ];
  territoriesVals;

  @track contactsList;

  @wire(MessageContext) messageContext;
  subscription = null;

  @wire(getContacts, {
    searchStr: "$searchTerm",
    accountId: "$accountId",
    territory: "$territory"
  })
  contacts({ data, error }) {
    if (data) {
      this.contactsList = [];
      data.forEach((contact) => {
        let contObj = {
          Id: contact.Id,
          Email: contact.Email,
          Name: contact.Name,
          Phone: contact.Phone,
          Territory: contact.Territory__c,
          Gender: contact.Gender__c
        };
        // if (contact.Gender__c === "Male") {
        //   contObj.Avatar =
        //     "https://v1.lightningdesignsystem.com/assets/images/avatar1.jpg";
        // } else if (contact.Gender__c === "Female") {
        //   contObj.Avatar =
        //     "https://v1.lightningdesignsystem.com/assets/images/avatar2.jpg";
        // } else {
        //   contObj.Avatar =
        //     "https://v1.lightningdesignsystem.com/assets/images/avatar3.jpg";
        // }
        this.contactsList.push(contObj);
      });
    }
    if (error) {
      console.log(error);
    }
  }
  // 0 :{ Email : "a_young@dickenson.com"
  // Id : "003dL00000HL96bQAD"
  // Name : "Andy Young"
  // Phone : "(785) 241-6200"
  // Territory__c : "North"}
  // Gender__c : Male

  @wire(getTerritoryStats) territoryStats({ data, error }) {
    if (data) {
      data.forEach((territory) => {
        if (territory.territoryName === "North") {
          this.northCount = territory.contactCount;
        }
        if (territory.territoryName === "South") {
          this.southCount = territory.contactCount;
        }
        if (territory.territoryName === "East") {
          this.eastCount = territory.contactCount;
        }
        if (territory.territoryName === "West") {
          this.westCount = territory.contactCount;
        }
      });
    }
    if (error) {
      console.log(
        "Error occured while fetching territory stats from Apex: ",
        error
      );
    }
  }

  @wire(getObjectInfo, { objectApiName: OBJ_CONTACT }) objectInfo;

  @wire(getPicklistValues, {
    recordTypeId: "$objectInfo.data.defaultRecordTypeId",
    fieldApiName: TERRITORY
  })
  territoryValues({ data, error }) {
    if (data) {
      let terrArr = data.values.map((territory) => {
        return { label: territory.label, value: territory.value };
      });
      this.filterTerritoryOptions = [
        ...this.filterTerritoryOptions,
        ...terrArr
      ];
      this.territoriesVals = terrArr;
    } else if (error) {
      console.log("fetching failed", error);
    }
  }

  @wire(getRecord, {
    recordId: "$returnedContactId",
    fields: [CONT_EMAIL, CONT_NAME, CONT_PHONE, CONT_TERRITORY]
  })
  updatedContact({ data, error }) {
    if (data) {
      let editedContIndex = this.contactsList.findIndex(
        (contact) => contact.Id === data.id
      );
      console.log("data: ", JSON.stringify(data));
      this.contactsList[editedContIndex].Name = data.fields.Name.value;
      this.contactsList[editedContIndex].Email = data.fields.Email.value;
      this.contactsList[editedContIndex].Phone = data.fields.Phone.value;
      this.contactsList[editedContIndex].Territory =
        data.fields.Territory__c.value;
      // {
      //   Name: data.fields.Name.value,
      //   Email: data.Email.value,
      //   Phone: data.Phone.value,
      //   Territory: data.Territory__c.value
      // };

      console.log("selected contact : ", this.contactsList[editedContIndex]);
    } else if (error) {
      console.log(error);
    }
  }

  // handler methods---------------------------------------------------------------------------------------

  handleFilterChange(event) {
    let { searchTerm, accountId, territory } = event.detail;
    if (searchTerm) {
      this.searchTerm = searchTerm;
    }
    if (accountId) {
      this.accountId = accountId;
    }
    if (territory) {
      this.territory = territory;
    }
  }

  handleNewContactModal(event) {
    if (event.detail.newContact) {
      this.openModal = true;
    }
    this.contactInfo = { contact: null };
  }

  handleCloseModal(event) {
    if (event.detail.closeModal) {
      this.openModal = false;
    }
  }

  async handleContactMenuSelect(event) {
    let selectedValue = event.detail.value;
    let selectedIndex = event.currentTarget.dataset.index;
    let selectedContact = this.contactsList[selectedIndex];
    try {
      if (selectedValue) {
        if (selectedValue === "viewContact") {
          // open contact in a new tab using navigation mixin
          let pageRef = {
            type: "standard__recordPage",
            attributes: {
              recordId: selectedContact.Id,
              objectApiName: this.objectInfo.apiName,
              actionName: "view"
            }
          };
          this[NavigationMixin.Navigate](pageRef);
        } else if (selectedValue === "editContact") {
          this.openModal = true;
          this.contactInfo = {
            contact: { ...selectedContact, contactIndex: selectedIndex }
          }; // ---> update logic moves to createContactModal
        } else if (selectedValue === "deleteContact") {
          // logic to delete contact
          await deleteRecord(selectedContact.Id);
          this.contactsList.splice(selectedIndex, 1);
          let toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Contact Deleted Successfully"
          });
          this.dispatchEvent(toastEvent);
          if (selectedContact.Territory === "North") {
            this.northCount -= 1;
          } else if (selectedContact.Territory === "South") {
            this.southCount -= 1;
          } else if (selectedContact.Territory === "West") {
            this.westCount -= 1;
          } else if (selectedContact.Territory === "East") {
            this.eastCount -= 1;
          }
        }
      }
    } catch (error) {
      console.log("error occured: ", error);
    }
  }

  // getter and setter functions------------------------------------------------------------------
  get showModal() {
    return this.openModal;
  }

  get getTerritoryOptions() {
    return (
      this.filterTerritoryOptions && this.territoriesVals && this.territoryStats
    );
  }

  get getContactsList() {
    return this.contactsList;
  }

  // life cycle methods---------------------------------------------------------------------------
  connectedCallback() {
    this.subscription = subscribe(
      this.messageContext,
      CONTACT_DASHBORD_MSG_CHANNEL,
      (message) => {
        // {"territory":"South","operation":"create"}
        if (
          message.hasOwnProperty("territory") &&
          message.hasOwnProperty("operation") &&
          message.operation === "create"
        ) {
          if (message.territory === "North") {
            this.northCount += 1;
          } else if (message.territory === "South") {
            this.southCount += 1;
          } else if (message.territory === "East") {
            this.eastCount += 1;
          } else if (message.territory === "West") {
            this.westCount += 1;
          }
        } else if (
          message.hasOwnProperty("territory") &&
          message.hasOwnProperty("operation") &&
          message.operation === "update"
        ) {
          // LMS Data:  {"territory":{"updatedTerritory":"North","oldTerritory":"East"},"operation":"update"}
          let { updatedTerritory, oldTerritory } = message.territory;
          if (updatedTerritory === "North") {
            this.northCount += 1;
          } else if (updatedTerritory === "South") {
            this.southCount += 1;
          } else if (updatedTerritory === "East") {
            this.eastCount += 1;
          } else if (updatedTerritory === "West") {
            this.westCount += 1;
          }
          if (oldTerritory === "North") {
            this.northCount -= 1;
          } else if (oldTerritory === "South") {
            this.southCount -= 1;
          } else if (oldTerritory === "East") {
            this.eastCount -= 1;
          } else if (oldTerritory === "West") {
            this.westCount -= 1;
          }

          // update the contactDetails
          if (message.hasOwnProperty("contactId")) {
            this.returnedContactId = message.contactId;
          }
        }
      }
    );
  }

  disconnectedCallback() {
    unsubscribe(this.subscription);
    this.subscription = null;
  }
}