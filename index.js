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

    bot.postMessageToChannel('calendar-bot-test', 'Get ready:', params);
});

//Error handling
bot.on('error', (err) => console.log(err));

//Message handler
bot.on('message', (data) => {
   if (data.type !== 'message') {
       return;
   }
   console.log(data);
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
    createUserCredentials(user);
   }
}

function createUserCredentials(user) {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Drive API.
      authorize(JSON.parse(content), listNextFiveEvents, user);
    });
}

function authorize(credentials, callback, user) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile('users/'+user+'.txt', (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback, user);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback, user) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  //replace with bot messaging user
  var username;
  for(var key in bot.getUsers()._value.members) {
    if (bot.getUsers()._value.members[key].id == user) {
        console.log(bot.getUsers()._value.members[key]);
        username = bot.getUsers()._value.members[key].name;
    }
  }
  bot.postMessageToUser(username,'Visit the following URL and paste the verification here:'+authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile('users/'+user+'.txt', JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', 'users/'+user+'.txt');
      });
      callback(oAuth2Client);
    });
  });
}

function listNextFiveEvents(auth) {
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
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary}`);
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}
