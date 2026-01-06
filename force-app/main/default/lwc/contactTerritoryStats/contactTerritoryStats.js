import { LightningElement, api, wire } from "lwc";

export default class ContactTerritoryStats extends LightningElement {
  //getter and setter methods--------------------------------------------------------

  @api countNorth;
  @api countSouth;
  @api countEast;
  @api countWest;
}