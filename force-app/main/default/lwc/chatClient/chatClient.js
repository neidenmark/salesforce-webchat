import { LightningElement, track, wire, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { loadScript } from 'lightning/platformResourceLoader';
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';
import EMAIL_FIELD from '@salesforce/schema/User.Email';
import SOCKETIO from '@salesforce/resourceUrl/socket';

export default class ChatClient extends LightningElement {
    @api serverUrl = "https://neidenmark-chat-server.herokuapp.com";
    @api recordId = "general";

    @track isChatEnabled = false;
    @track error;
    @track email;
    @track name;
    @track inputMessage = "";
    @track entries = [];
    sock;
    
    initializeSocketIO() {
        var self = this;
        if(this.sock && this.sock.connected) {
            return;
        }
        this.sock = io(this.serverUrl);
        this.sock.on('chat message', function(message){
            var json;
            console.log("Chat onMessage");
            // try to parse JSON message. Because we know that the server
            // always returns JSON this should work without any problem but
            // we should make sure that the massage is not chunked or
            // otherwise damaged.
            console.log("Message Data:"+message);
            try {
                json = JSON.parse(message);
            } catch (e) {
                console.log('Invalid JSON: ', message);
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
        });
    }
    connect() {
        Promise.all([
            loadScript(this, SOCKETIO + '/socket.io.js')
        ])
            .then(() => {
                this.initializeSocketIO();
            });
    }
    renderedCallback() {
        console.log("renderedCallback()");
        console.log("renderedCallback(): name:" + this.name);
        this.connect();
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
                    this.connect();
                }
            }
        }
    }
    sendText(txt) {
        var msgObj = { id: this.recordId, userid: USER_ID, name: this.name, text: txt };
        var msgJson = JSON.stringify(msgObj);
        console.log("sendText(): Sending message:"+msgJson);
        console.log("sendText(): isConnected:"+this.sock.connected);
        if(!this.sock.connected) {
            this.connect();
        }
        this.sock.emit('chat message', msgJson);
    }
    handleChange(evt) {
        var msg = evt.target.value;
        this.inputMessage = "";
        console.log("sendMessage() msg:"+msg);

        this.sendText(msg);
    }
}