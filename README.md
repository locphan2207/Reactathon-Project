# VidAMA

[Live Site](https://videoama.netlify.com/)

**To test:**
- You need two different computers to test, or you can open many different tabs
- Enter your name as 'host' to become the host (the main stream video)
- Enter other names to become an audience
- Audience can raise question, your name will be in the queue right after
- Host can click on names in the queue to open video connection with the audience and talk with them
- Host can click 'clear speaker' button to close video connection with audience
- Pop-up video can be dragged to other position within the main stream region.

### [AMA has never been easier.](https://videoama.netlify.com/)

Collaborative video conferencing and audience participation at the touch of the button.

<!-- ![VidAMA](./docs/VidAMA.png "VidAMA Logo") -->

![VidAMA](./docs/VidAMA.gif "VidAMA gif")
## Features

Capture the essence of Reddit AMA and TedX on live video!

* Start a video chat room with a speaker(host) and audience members
* Stream both the speaker and a nominated audience member
* Live chat sidebar for audience to engage with each other
* See who's queued up to stream-in a question
* Audience can queue up to ask a question
* Speaker can moderate queue to answer questions

## Technologies

### React
* Responsive Single Page App
* Modular components

### TokBox
* manages multiple video streams of users

```javascript
handleSubmit = (e) => {
    e.preventDefault();
    let messageBody = this.state.value.trim()

    if (messageBody) {
      this.sessionHelper.session.signal({
        type: 'msg',
        data: `{"author_name": "${this.props.currentUser}", "body": "${messageBody}"}`,
      }, (error) => {
        if (error) {
          console.log('Error sending signal:', error.name, error.message);
        } else {
          this.props.createMessage(this.props.currentUser, messageBody)
            .then(() => {
              const list = document.querySelector('.chat-messages');
              list.scrollTop = list.scrollHeight;
          });
        }
      });

      e.target.value = '';
      this.setState({ value: '' });
    }
  }
```

### Netlify
* Lambdas, used to abstract away interaction with API keys for security
* Automatic deployment and serverless backend

```javascript
// Lambda functions called using RESTful API endpoints.

const axios = require('axios');
const OpenTok = require('opentok');
require('dotenv').config();

const tokbox_key = process.env.TOKBOX_API_KEY;
const tokbox_secret = process.env.TOKBOX_SECRET;

export function handler(event, context, callback) {
  var opentok = new OpenTok(tokbox_key, tokbox_secret);

  opentok.createSession(function(err, session) {
    if (err) {
      return console.log(err);
    } else {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({payload: session.sessionId})
      });
    }
  });
}
```

### Hasura
* Quick to build, easy to use backend
* Stores and serves up:
    * data of speakers and audience members for UI
    * chat messages, powering live chat

```javascript
// messages_api_util.js

export const createMessage = (authorName, body) =>
  $.ajax({
    url: "https://data.absolve11.hasura-app.io/v1/query",
    contentType: "application/json",
    data: JSON.stringify({
      "type": "insert",
      "args": {
        "table": "messages",
        "objects": [
            {
              "author_name": `${authorName}`,
              "body": `${body}`
            }
        ]
      }
    }),
    type: "POST",
    dataType: "json"
  });
```
