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
   handleMessage(data);
});
// Respond to data
function handleMessage(data) {
    var message = data.text;
    var user = data.user;
    console.log(data);
   if (/^calendar\sday$/.test(message)) {
        callApiFunction(user, user, listDayEvents);
   } else if(/^calendar\sday\s<@\w+>$/.test(message)) {
        let dest = getUserFromMessage(message);
        callApiFunction(user, dest, listDayEvents);
   } else if (/^calendar\sweek$/.test(message)) {
        callApiFunction(user, user, listWeekEvents);
   } else if(/^calendar\sweek\s<@\w+>$/.test(message)) {
        let dest = getUserFromMessage(message);
        callApiFunction(user, dest, listWeekEvents);
   } else if (/^calendar\smorning$/.test(message)) {
      callApiFunction(user, user, listMorningEvents);
   } else if(/^calendar\smorning\s<@\w+>$/.test(message)) {
      let dest = getUserFromMessage(message);
      callApiFunction(user, dest, listMorningEvents);
   } else if (/^calendar\shelp$/.test(message)) {
        helpMessage(user);
   } else if (/^calendar\sfive$/.test(message)) {
        callApiFunction(user, user, listNextFiveEvents);
   } else if (/^URL:\s\w+$/.test(message)) {
        storeAuthentication(message.split(' ')[1], user);
   } else if (/^calendar\s.+$/.test(message)) {
        var username = getNameFromId(user);
        bot.postMessageToUser(username,"Invalid command, please use 'calendar help'");
   }
}

function getUserFromMessage(message) {
    var dest = (message.match(/<@.+>/g))[0];
    dest = dest.substr(2, dest.length - 3);
    console.log(dest);
    return dest;
}

function helpMessage(user) {
    var username = getNameFromId(user);
    bot.postMessageToUser(username,"Welcome to the calendar bot! Here is a list of commands:\n"
    + "1) calendar help - lists commands for the calendar bot (you're donig this right now!)\n"
    + "2) calendar five - lists the first five events you have in your calendar\n"
    + "3) calendar morning @[user] - sends your morning calendar to the specified user or leave it blank to messsage yourself\n"
    + "4) calendar day @[user] - sends your days calendar to the specified user or leave it blank to message yourself\n"
    + "5) calendar week @[user] - sends your week calendar to the specified user or leave it blank to message yourself\n"
    + "6) URL: [authentication] - used when first setting up your google accounr to a calendar\n");
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
          bot.postMessageToUser(username,"Successfully set up google calendar authorization!\nYou can now process commands!");
        });
      });
    });
}

function callApiFunction(userCalendar, directedUser, callback) {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Drive API.
      authorize(JSON.parse(content), callback, userCalendar, directedUser);
    });
}

function authorize(credentials, callback, userCalendar, directedUser) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile('users/'+userCalendar+'.txt', (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback, userCalendar);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, userCalendar, directedUser);
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

function listNextFiveEvents(auth, userSent, destUser) {
  var destUsername = getNameFromId(destUser);
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
    let retString = eventsToString(events,userSent);
    bot.postMessageToUser(destUsername,retString);
  });
}

function listMorningEvents(auth, user, destUser) {
  //parse message for receiving user
  var destUsername = getNameFromId(destUser);
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (getCurrentDate() + "T07:00:00-05:00").toString(),
    timeMax: (getCurrentDate() + "T12:00:00-05:00").toString(),
    singleEvents: true,
    orderBy: "startTime",
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    let retString = eventsToString(events, user);
    bot.postMessageToUser(destUsername,retString);
  });  
}

function listDayEvents(auth, userSent, destUser) {
  //parse message for receiving user
  var destUsername = getNameFromId(destUser);
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (getCurrentDate() + "T07:00:00-05:00").toString(),
    timeMax: (getCurrentDate() + "T18:30:00-05:00").toString(),
    singleEvents: true,
    orderBy: "startTime",
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    let retString = eventsToString(events, userSent);
    bot.postMessageToUser(destUsername,retString);
  });  
}

function listWeekEvents(auth, userSent, destUser) {
  var destUsername = getNameFromId(destUser);
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (getCurrentDate() + "T07:00:00-05:00").toString(),
    timeMax: (getDaysAwayDate(7) + "T18:30:00-05:00").toString(),
    
    singleEvents: true,
    orderBy: "startTime",
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    let retString = eventsToString(events, userSent);
    bot.postMessageToUser(destUsername,retString);
  });
}

function getCurrentDate(){
  let date = "";
  let day = new Date();
  date = day.getFullYear() + "-" + dateAppendZero(day.getMonth() + 1) + "-" + dateAppendZero(day.getDate());  

  return date;
}
function getDaysAwayDate(days) {
  let date = ""
  let day = new Date();
  day.setDate(day.getDate() + days);
  date = day.getFullYear() + "-" + dateAppendZero(day.getMonth() + 1) + "-" + dateAppendZero(day.getDate());  
  
  return date;
}

function dateAppendZero(dateItem) {
  if (dateItem.toString().length == 1) {
    dateItem = "0" + dateItem;
  }
  return dateItem;
}

function parseTimeOfEvent(date){
  
  let time = new Date(date);
  let hours = time.getHours();
  
  let amPm = "";
  if (hours >= 12) {
    amPm = " PM";
  } else {
    amPm = " AM"
  }
  hours = (hours % 12) || 12;

  let mins = time.getMinutes();
  time = dateAppendZero(hours).toString() + ":" + dateAppendZero(mins).toString() + amPm;
  return time;
}

function parseWeekdayOfEvent(index) {
  let daysOfWeek = ["SUN", "MON", "TUES", "WED", "THURS", "FRI", "SAT"];
  return daysOfWeek[index];
}

function eventsToString(events, userSent) {
    if (events.length) {
         let eventString = "";
         eventString += "<@"+userSent+"> has sent you part of their calendar:\n"
         let prevDayNum = -1;
         events.map((event, i) => {
         console.log(event);
           const start = event.start.dateTime || event.start.date;
           const end = event.end.dateTime || event.end.date;
           const day = new Date(start);
           if (day.getDay() !== prevDayNum) {
            eventString += `${parseWeekdayOfEvent(day.getDay())}\n`;
            prevDayNum = day.getDay();
           }
           eventString += `\t\t${parseTimeOfEvent(start)} - ${parseTimeOfEvent(end)}: ${event.summary}\n`;
         });
         return eventString;
       } else {
         return 'No upcoming events today.';
       }
}
