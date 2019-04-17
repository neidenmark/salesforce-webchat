import { LightningElement, api } from 'lwc';
import USER_ID from '@salesforce/user/Id';

export default class ChatClientEntry extends LightningElement {
    @api entry;

    get formattedTime() {
        return new Date(this.entry.time).toLocaleTimeString();
    }
    get className() {
        if(this.entry.userid === USER_ID) {
            return "slds-chat-listitem slds-chat-listitem_outbound";
        }
        return "slds-chat-listitem slds-chat-listitem_inbound";
    }
    get msgClassName() {
        if(this.entry.userid === USER_ID) {
            return "slds-chat-message__text slds-chat-message__text_outbound";
        }
        return "slds-chat-message__text slds-chat-message__text_inbound";
    }
}