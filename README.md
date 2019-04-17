# SFDX App

## Dev, Build and Test

## Resources

## Description of Files and Directories

## Issues
import { LightningElement, track, wire, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';
import EMAIL_FIELD from '@salesforce/schema/User.Email';

export default class ChatClient extends LightningElement {
    @api serverUrl = "wss://neidenmark-chat-server.herokuapp.com";
    @api recordId = "general";

    @track isChatEnabled = false;
    @track error;
    @track email;
    @track name;
    connection;
    @track inputMessage = "";
    @track entries = [];
    
    connectWS() {
        var self = this;
        console.log("connectWS()");

        console.log("connectWS():" + this.serverUrl);
        this.connection = new WebSocket(this.serverUrl);
        this.connection.onopen = function() {
            self.isChatEnabled = true;
            console.log("onopen()");
        }
        this.connection.onerror = function() {
            self.isChatEnabled = false;
            console.log("onerror()");
            self.connection.close();
        }
        this.connection.onclose = function() {
            self.isChatEnabled = false;
            console.log("onclose()");
            self.connectWS();
        }
        this.connection.onmessage = function(message) {
            var json;
            console.log("Chat onMessage");
            // try to parse JSON message. Because we know that the server
            // always returns JSON this should work without any problem but
            // we should make sure that the massage is not chunked or
            // otherwise damaged.
            console.log("Message Data:"+message.data);
            try {
                json = JSON.parse(message.data);
            } catch (e) {
                console.log('Invalid JSON: ', message.data);
                return;
            }
            // NOTE: if you're not sure about the JSON structure
            // check the server source code above
            // first response from the server with user's color
            if (json.type === 'color') {
                //myColor = json.data;
                //status.text(myName + ': ').css('color', myColor);
                //input.removeAttr('disabled').focus();
                // from now user can start sending messages
            } else if (json.type === 'history') { // entire message history
                // insert every single message to the chat window
                //for (var i=0; i < json.data.length; i++) {
                //addMessage(json.data[i].author, json.data[i].text,
                //   json.data[i].color, new Date(json.data[i].time));
                //}
            } else if (json.type === 'message') { // it's a single message
                // let the user write another message
                //addMessage(json.data.author, json.data.text,
                //           json.data.color, new Date(json.data.time));
                self.entries.push(json.data);
            } else {
                console.log('Hmm..., I\'ve never seen JSON like this:', json);
            }
        }


    }
    renderedCallback() {
        console.log("renderedCallback()");
        console.log("renderedCallback(): name:" + this.name);
        if (!this.isChatEnabled) {
            if (this.name) {
                this.connectWS();
            }
        }
    }

    @wire(getRecord, {
        recordId: USER_ID,
        fields: [NAME_FIELD, EMAIL_FIELD]
    }) wireuser({
        error,
        data
    }) {
        if (error) {
            this.error = error;
        } else if (data) {
            this.email = data.fields.Email.value;
            this.name = data.fields.Name.value;
            console.log("NAME:" + this.name);
            if (!this.isChatEnabled) {
                if (this.name) {
                    this.connectWS();
                }
            }
        }
    }
    sendText(txt) {
        var msgObj = { id: this.recordId, userid: USER_ID, name: this.name, text: txt };
        console.log("sendText(): Sending message:"+JSON.stringify(msgObj));
        console.log("sendText(): This.connection:"+this.connection);
        console.log("sendText(): this.isChatEnabled:"+this.isChatEnabled);
        if (!(this.connection && this.isChatEnabled)) {
            this.connectWS();
        }

        this.connection.send(JSON.stringify(msgObj));
    }
    handleChange(evt) {
        var msg = evt.target.value;
        this.inputMessage = "";
        console.log("sendMessage() msg:"+msg);

        this.sendText(msg);
    }
}