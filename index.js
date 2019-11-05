const SlackBot = require('slackbots');
const axios = require('axios');

var fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

const bot = new SlackBot({
    token: 'xoxb-759347243669-821664786679-vMYPENCAesn1EzDBSJp5QwZo',
    name: 'calendarbot'
});

// Start Handler

bot.on('start', () => {
    const params = {
        icon_emoji: ':calendar:'
    };
});

//Error handling
bot.on('error', (err) => console.log(err));

//Message handler
bot.on('message', (data) => {
   if (data.type !== 'message') {
       return;
   }
   handleMessage(data.text, data.user);
});
// Respond to data
function handleMessage(message, user) {
   if (message.includes(' morning')) {
       console.log("option 1");
       bot.postMessageToChannel('calendar-bot-test', 'Morning!');
   } else if (message.includes(' day')) {
       bot.postMessageToChannel('calendar-bot-test', 'day!');
       console.log("option 2");
       bot.postMessageToChannel('calendar-bot-test', 'hey!');
   } else if (message.includes(' five')) {
       callApiFunction(user,listNextFiveEvents);
   } else if (message.includes('URL: ')) {
       storeAuthentication(message.split(' ')[1], user);
   }
}

function storeAuthentication(message, user) {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      var credentials = JSON.parse(content);
      const {client_secret, client_id, redirect_uris} = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      
      var username = getNameFromId(user);
      oAuth2Client.getToken(message, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile('users/'+user+'.txt', JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', 'users/'+user+'.txt');
        });
      });
    });
}

function callApiFunction(user, callback) {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Drive API.
      authorize(JSON.parse(content), callback, user);
    });
}

function authorize(credentials, callback, user) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile('users/'+user+'.txt', (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback, user);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, user);
  });
}

function getAccessToken(oAuth2Client, callback, user) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  //replace with bot messaging user
  var username = getNameFromId(user);
  
  bot.postMessageToUser(username,'Visit the following URL and paste the verification here\n'+authUrl+'\nFormat it in the following way:\nURL: [DATA FROM AUTHENTICATION]');
}

function getNameFromId(user) {
    for(var key in bot.getUsers()._value.members) {
      if (bot.getUsers()._value.members[key].id == user) {
          return bot.getUsers()._value.members[key].name;
      }
    }
}

function listNextFiveEvents(auth, user) {
var username = getNameFromId(user);
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 5,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      events.map((event, i) => {
      console.log(event);
        const start = event.start.dateTime || event.start.date;
        bot.postMessageToUser(username,`${start} - ${event.summary}`);
      });
    } else {
      bot.postMessageToUser(username,'No upcoming events found.');
    }
  });
}
