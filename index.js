const SlackBot = require('slackbots');

const fs = require('fs');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// Declares bot with token for slack group it is in
const bot = new SlackBot({
  token: 'xoxb-759347243669-821664786679-vMYPENCAesn1EzDBSJp5QwZo',
  name: 'calendarbot',
});

// Start Handler
bot.on('start', () => {});

// Error handling
bot.on('error', (err) => console.log(err));

// Triggers bot when message is sent to it to handle
bot.on('message', (data) => {
  if (data.type !== 'message') {
    return;
  }
  handleMessage(data);
});

/**
  * Handles message sent to calendar-bot
  * @param {String} data
  */
function handleMessage(data) {
  const message = data.text;
  const user = data.user;
  if (/^calendar\sday$/.test(message)) {
    callApiFunction(user, user, listDayEvents);
  } else if (/^calendar\sday\s<@\w+>$/.test(message)) {
    const dest = getUserFromMessage(message);
    callApiFunction(user, dest, listDayEvents);
  } else if (/^calendar\sweek$/.test(message)) {
    callApiFunction(user, user, listWeekEvents);
  } else if (/^calendar\sweek\s<@\w+>$/.test(message)) {
    const dest = getUserFromMessage(message);
    callApiFunction(user, dest, listWeekEvents);
  } else if (/^calendar\smorning$/.test(message)) {
    callApiFunction(user, user, listMorningEvents);
  } else if (/^calendar\smorning\s<@\w+>$/.test(message)) {
    const dest = getUserFromMessage(message);
    callApiFunction(user, dest, listMorningEvents);
  } else if (/^calendar\shelp$/.test(message)) {
    helpMessage(user);
  } else if (/^calendar\sfive$/.test(message)) {
    callApiFunction(user, user, listNextFiveEvents);
  }  else if (/^calendar\sfree$/.test(message)) {
    callApiFunction(user, user, listFreeTime);
  } else if (/^calendar\sfree\s<@\w+>$/.test(message)) {
    const dest = getUserFromMessage(message);
    callApiFunction(user, dest, listFreeTime);
  } else if (/^URL:\s.+$/.test(message)) {
    storeAuthentication(message.split(' ')[1], user);
  } else if (/^calendar\s.+$/.test(message)) {
    const username = getNameFromId(user);
    bot.postMessageToUser(username, 'Invalid command, please use \'calendar help\'');
  }
}

/**
  * From message, retrieves the user who message will be sent to
  * @param {String} message
  * @return {String}
  */
function getUserFromMessage(message) {
  let dest = (message.match(/<@.+>/g))[0];
  dest = dest.substr(2, dest.length - 3);
  return dest;
}

/**
  * Lists help options when user wants help using calendar bot
  * @param {String} user
  */
function helpMessage(user) {
  const username = getNameFromId(user);
  bot.postMessageToUser(username, 'Welcome to the calendar bot! Here is a list of commands:\n' +
    '1) calendar help - lists commands for the calendar bot (you\'re donig this right now!)\n' +
    '2) calendar five - lists the next five events you have in your calendar\n' +
    '3) calendar morning @[user] - sends your morning calendar to the specified user or leave it blank to messsage yourself\n' +
    '4) calendar day @[user] - sends your days calendar to the specified user or leave it blank to message yourself\n' +
    '5) calendar week @[user] - sends your week calendar to the specified user or leave it blank to message yourself\n' +
    '6) URL: [authentication] - used when first setting up your google accounr to a calendar\n');
}


/**
* Stores the users authentication code in a text file
* @param {String} message
* @param {String} user
*/
function storeAuthentication(message, user) {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    const credentials = JSON.parse(content);
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const username = getNameFromId(user);
    oAuth2Client.getToken(message, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile('users/'+user+'.txt', JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        bot.postMessageToUser(username, 'Successfully set up google calendar authorization!\nYou can now process commands!');
      });
    });
  });
}

/**
* Loads the app credentials and continues to attempt google api authorization
* @param {String} userCalendar
* @param {String} directedUser
* @param {Function} callback
*/
function callApiFunction(userCalendar, directedUser, callback) {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), callback, userCalendar, directedUser);
  });
}

/**
* Attempts to authorize with google api and call then call the callback function
* @param {Object} credentials
* @param {Function} callback
* @param {String} userCalendar
* @param {String} directedUser
*/
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

/**
* Sends an authentication url to an unauthorized user
* @param {Object} oAuth2Client
* @param {Function} callback
* @param {String} user
*/
function getAccessToken(oAuth2Client, callback, user) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  // replace with bot messaging user
  const username = getNameFromId(user);

  bot.postMessageToUser(username, 'Visit the following URL and paste the verification here\n'+authUrl+'\nFormat it in the following way:\nURL: [DATA FROM AUTHENTICATION]');
}

/**
 * Retrieves the generalized username for slackbotjs messaging from the given ID code
 * @param {String} user
 * @return {String}
 */
function getNameFromId(user) {
  for (const key in bot.getUsers()._value.members) {
    if (bot.getUsers()._value.members[key].id == user) {
      return bot.getUsers()._value.members[key].name;
    }
  }
}

/**
  * Lists next 5 calendar events as message sent to user in slack
  * @param {String} auth
  * @param {String} userSent
  * @param {String} destUser
  */
function listNextFiveEvents(auth, userSent, destUser) {
  const destUsername = getNameFromId(destUser);
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
    const retString = eventsToString(events, userSent);
    bot.postMessageToUser(destUsername, retString);
  });
}

/**
  * Lists morning events as message sent to user in slack
  * @param {String} auth
  * @param {String} user
  * @param {String} destUser
  */
function listMorningEvents(auth, user, destUser) {
  const destUsername = getNameFromId(destUser);
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (getCurrentDate() + 'T07:00:00-05:00').toString(),
    timeMax: (getCurrentDate() + 'T12:00:00-05:00').toString(),
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    const retString = eventsToString(events, user);
    bot.postMessageToUser(destUsername, retString);
  });
}

/**
  * Lists daily events as message sent to user in slack
  * @param {String} auth
  * @param {String} userSent
  * @param {String} destUser
  */
function listDayEvents(auth, userSent, destUser) {
  // parse message for receiving user
  const destUsername = getNameFromId(destUser);
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (getCurrentDate() + 'T07:00:00-05:00').toString(),
    timeMax: (getCurrentDate() + 'T18:30:00-05:00').toString(),
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    const retString = eventsToString(events, userSent);
    bot.postMessageToUser(destUsername, retString);
  });
}

/**
  * Lists weekly events as message sent to user in slack
  * @param {String} auth
  * @param {String} userSent
  * @param {String} destUser
  */
function listWeekEvents(auth, userSent, destUser) {
  const destUsername = getNameFromId(destUser);
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (getCurrentDate() + 'T07:00:00-05:00').toString(),
    timeMax: (getDaysAwayDate(7) + 'T18:30:00-05:00').toString(),
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    const retString = eventsToString(events, userSent);
    bot.postMessageToUser(destUsername, retString);
  });
}

/**
  * Lists free time during current day to user in channel
  * @param {String} auth
  * @param {String} userSent
  * @param {String} destUser
  */
function listFreeTime(auth, userSent, destUser) {
  // parse message for receiving user
  const destUsername = getNameFromId(destUser);
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (getCurrentDate() + 'T07:00:00-05:00').toString(),
    timeMax: (getCurrentDate() + 'T18:30:00-05:00').toString(),
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    const retString = freeTimeToString(events, userSent);
    bot.postMessageToUser(destUsername, retString);
  });
}

/**
  * Gets current date using JS functions and returns it to user in string format
  * @return {String}
  */
function getCurrentDate() {
  let date = '';
  const day = new Date();
  date = day.getFullYear() + '-' + dateAppendZero(day.getMonth() + 1) + '-' + dateAppendZero(day.getDate());
  return date;
}

/**
  * Intakes day count and retrieves the calendar date for current+days away and returns it as a string
  * @param {int} days
  * @return {String}
  */
function getDaysAwayDate(days) {
  let date = '';
  const day = new Date();
  day.setDate(day.getDate() + days);
  date = day.getFullYear() + '-' + dateAppendZero(day.getMonth() + 1) + '-' + dateAppendZero(day.getDate());
  return date;
}

/**
  * Intakes number and checks if it needs a leading zero to meet format criteria
  * @param {int} dateItem
  * @return {int}
  */
function dateAppendZero(dateItem) {
  if (dateItem.toString().length == 1) {
    dateItem = '0' + dateItem;
  }
  return dateItem;
}

/**
  * Intakes date in JS format as 24hr format and returns the date string in a 12 hour format with AM/PM
  * @param {String} date
  * @return {Date}
  */
function parseTimeOfEvent(date) {
  let time = new Date(date);
  let hours = time.getHours();

  let amPm = '';
  if (hours >= 12) {
    amPm = ' PM';
  } else {
    amPm = ' AM';
  }
  hours = (hours % 12) || 12;

  const mins = time.getMinutes();
  time = dateAppendZero(hours).toString() + ':' + dateAppendZero(mins).toString() + amPm;
  return time;
}

/**
  * Gets index of day of week and returns day as string accordingly
  * @param {int} index
  * @return {String}
  */
function parseWeekdayOfEvent(index) {
  const daysOfWeek = ['SUN', 'MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT'];
  return daysOfWeek[index];
}

/**
  * Gets index of month and returns month as string accordingly
  * @param {int} index
  * @return {String}
  */
function parseMonthOfEvent(index) {
  const monthOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return monthOfYear[index];
}

/**
* Canverts an event object into a string
* @param {Event} events
* @param {String} userSent
* @return {String}
*/
function eventsToString(events, userSent) {
  if (events.length) {
    let eventString = '';
    eventString += '<@'+userSent+'> has sent you part of their calendar:\n';
    let prevDayNum = -1;
    events.map((event, i) => {
      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;
      const day = new Date(start);
      if (day.getDay() !== prevDayNum) {
        eventString += `${parseWeekdayOfEvent(day.getDay())} - ${parseMonthOfEvent(day.getMonth())} ${day.getDate()}\n`;
        prevDayNum = day.getDay();
      }
      eventString += `\t\t${parseTimeOfEvent(start)} - ${parseTimeOfEvent(end)}: ${event.summary}\n`;
    });
    return eventString;
  } else {
    return 'No upcoming events today.';
  }
}

/**
* Finds time between events in work day
* @param {Event} events
* @param {String} userSent
* @return {String}
*/
function freeTimeToString(events, userSent) {
  if (events.length) {
    let eventString = '';
    eventString += '<@'+userSent+'> has sent you their free time for today:\n';
    let prevDayNum = -1;
    events.map((event, i) => {
      if (i === 0) {
        const start = event.start.dateTime || event.start.date;
        const end = event.end.dateTime || event.end.date;
        const day = new Date(start);
        if (day.getDay() !== prevDayNum) {
          eventString += `${parseWeekdayOfEvent(day.getDay())} - ${parseMonthOfEvent(day.getMonth())} ${day.getDate()}\n`;
          prevDayNum = day.getDay();
        }
        eventString += `\t\t08:00 AM - ${parseTimeOfEvent(start)} \n\t\t${parseTimeOfEvent(end)} - `;
      } else {
        const start = event.start.dateTime || event.start.date;
        const end = event.end.dateTime || event.end.date;
        eventString += `${parseTimeOfEvent(start)} \n\t\t${parseTimeOfEvent(end)} - `;
      }
    });
    eventString += '04:30 PM'
    return eventString;
  } else {
    return 'Free all day!';
  }
}

module.exports = {getUserFromMessage, getCurrentDate, getDaysAwayDate, dateAppendZero, parseTimeOfEvent, parseWeekdayOfEvent, parseMonthOfEvent};
