import { LightningElement, api, wire } from "lwc";
import { createRecord, updateRecord } from "lightning/uiRecordApi";
import CONT_FNAME from "@salesforce/schema/Contact.FirstName";
import CONT_LNAME from "@salesforce/schema/Contact.LastName";
import CONT_TERRITORY from "@salesforce/schema/Contact.Territory__c";
import CONT_EMAIL from "@salesforce/schema/Contact.Email";
import CONT_PHONE from "@salesforce/schema/Contact.Phone";
import CONT_ID from "@salesforce/schema/Contact.Id";
import CONTACT_OBJ from "@salesforce/schema/Contact";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { publish, MessageContext } from "lightning/messageService";
import CONTACT_DASHBORD_MSG_CHANNEL from "@salesforce/messageChannel/contactDashboardMsgChannel__c";

export default class CreateContactModal extends LightningElement {
  // decorators-----------------------------------------------------------------

  @api allTerritories;
  @wire(MessageContext) messageContext;
  fName;
  lName;
  contactEmail;
  contactId;
  territory;
  oldTerritory;
  contactPhone;
  isEdit = false;
  // internal variables------------------------------------
  _contactInfo;

  // getter and setter methods------------------------------------------------------
  get territoriesFound() {
    return this.allTerritories;
  }

  @api get contactInfo() {
    return this._contactInfo;
  }
  /**
   * vals:  {"Id":"003dL00000HL96ZQAT",
   * "Email":"jrogers@burlington.com",
   * "Name":"Jack Rogers",
   * "Phone":"(336) 222-7000",
   * "Territory":"East"}
   */
  set contactInfo(value) {
    if (value.contact != null) {
      this.isEdit = true;
      let { contact } = value;
      this.fName = contact.Name.split(" ")[0];
      this.lName = contact.Name.split(" ")[1];
      this.contactEmail = contact.Email;
      this.contactPhone = contact.Phone;
      this.territory = contact.Territory;
      this.oldTerritory = contact.Territory;
      this.contactId = contact.Id;
    } else {
      this.isEdit = false;
      this.fName = "";
      this.lName = "";
      this.contactEmail = "";
      this.contactPhone = "";
      this.territory = "";
    }
  }

  // handler methods---------------------------------------------------------------
  handleCloseModal() {
    this.closeModal();
  }

  handleContactInputs(event) {
    let { name, value } = event.target;
    if (name === "fName") {
      this.fName = value;
    } else if (name === "contactEmail") {
      this.contactEmail = value;
    } else if (name === "territory") {
      this.territory = value;
    } else if (name === "contactPhone") {
      this.contactPhone = value;
    } else if (name === "lName") {
      this.lName = value;
    }
  }
  async handleCreateContact() {
    let fields = {};
    fields[CONT_FNAME.fieldApiName] = this.fName;
    fields[CONT_LNAME.fieldApiName] = this.lName;
    fields[CONT_EMAIL.fieldApiName] = this.contactEmail;
    fields[CONT_PHONE.fieldApiName] = this.contactPhone;
    fields[CONT_TERRITORY.fieldApiName] = this.territory;
    let recordInput = { apiName: CONTACT_OBJ.objectApiName, fields };
    try {
      let record = await createRecord(recordInput);
      if (record.hasOwnProperty("id")) {
        this.showToasts(
          "Success",
          `Contact created successfully ${record.id}`,
          "success"
        );
        publish(this.messageContext, CONTACT_DASHBORD_MSG_CHANNEL, {
          territory: this.territory,
          operation: "create"
        });
        console.log("message published to the message channel");
      } else {
        this.showToasts(
          "Error",
          `Error occured while creating contact`,
          "error"
        );
      }
    } catch (error) {
      console.log(
        "error occured: ",
        JSON.stringify(error.body.output.fieldErrors)
      );
      this.showToasts("Error", `Error occured while creating contact`, "error");
    }

    this.closeModal();
  }

  async handleUpdateContact() {
    console.log("contact update logic here");
    let fields = {};
    fields[CONT_ID.fieldApiName] = this.contactId;
    fields[CONT_FNAME.fieldApiName] = this.fName;
    fields[CONT_LNAME.fieldApiName] = this.lName;
    fields[CONT_EMAIL.fieldApiName] = this.contactEmail;
    fields[CONT_PHONE.fieldApiName] = this.contactPhone;
    fields[CONT_TERRITORY.fieldApiName] = this.territory;
    let recordInput = { fields };
    try {
      let record = await updateRecord(recordInput);
      if (record.hasOwnProperty("id")) {
        this.showToasts(
          "Success",
          `Contact updated successfully ${record.id}`,
          "success"
        );
        publish(this.messageContext, CONTACT_DASHBORD_MSG_CHANNEL, {
          territory: {
            updatedTerritory: this.territory,
            oldTerritory: this.oldTerritory
          },
          operation: "update",
          contactId: this.contactId
        });
      }
    } catch (error) {
      console.log("error occured while updating the contact: ", error);
    }
    this.closeModal();
  }

  closeModal() {
    let event = new CustomEvent("closemodal", { detail: { closeModal: true } });
    this.dispatchEvent(event);
  }

  showToasts(eventTitle, eventMessage, eventVariant) {
    let event = new ShowToastEvent({
      title: eventTitle,
      message: eventMessage,
      variant: eventVariant
    });
    this.dispatchEvent(event);
  }
}