const index = require('./index');

const fullDayEvent = [
  { 
    summary: 'Full Day Event',
    start:{ dateTime: '2019-11-19T08:30:00-05:00' },
    end:{ dateTime: '2019-11-19T16:30:00-05:00' },
  }
];

const morningEvents = [ 
  { 
    summary: 'Morning Stand up',
    start:{ dateTime: '2019-11-19T08:30:00-05:00' },
    end:{ dateTime: '2019-11-19T09:30:00-05:00' },
  },
  { 
    summary: 'Coffee Run',
    start:{ dateTime: '2019-11-19T09:45:00-05:00' },
    end:{ dateTime: '2019-11-19T10:00:00-05:00' },
  }
];

const dayEvents = [ 
  { 
    summary: 'Morning Stand up',
    start:{ dateTime: '2019-11-19T08:30:00-05:00' },
    end:{ dateTime: '2019-11-19T09:30:00-05:00' },
  },
  { 
    summary: 'Afternoon hang',
    start:{ dateTime: '2019-11-19T12:45:00-05:00' },
    end:{ dateTime: '2019-11-19T13:00:00-05:00' },
  }
];

const preNoonPostNoonEvent = [  
  {
  summary: '1 Bite Lunch Time',
  start:{ dateTime: '2019-11-19T11:59:00-05:00' },
  end:{ dateTime: '2019-11-19T12:01:00-05:00' },
  },
];

const weekEvents = [ 
  { 
    summary: 'Weekly Stand up',
    start:{ dateTime: '2019-11-26T08:30:00-05:00' },
    end:{ dateTime: '2019-11-26T09:30:00-05:00' },
  },
  { 
    summary: 'Afternoon hang',
    start:{ dateTime: '2019-11-28T12:45:00-05:00' },
    end:{ dateTime: '2019-11-28T13:00:00-05:00' },
  }
];

const weekIntoNewMonthEvents = [ 
  { 
    summary: 'End of month event',
    start:{ dateTime: '2019-10-31T08:30:00-05:00' },
    end:{ dateTime: '2019-10-31T09:30:00-05:00' },
  },
  { 
    summary: 'Start of month event',
    start:{ dateTime: '2019-11-01T12:45:00-05:00' },
    end:{ dateTime: '2019-11-01T13:00:00-05:00' },
  }
];

const emptyEventList = [];

test('Get string for empty event list to string', () => {
  expect(index.eventsToString(emptyEventList)).toBe('No upcoming events.');
});

test('Get full day event converted in string format', () => {
  expect(index.eventsToString(fullDayEvent)).toBe('TUES - November 19\n\t\t08:30 AM - 04:30 PM: Full Day Event\n');
});

test('Get personal morning events when there are multiple morning events', () => {
  expect(index.eventRecipientToString('self','self','morning') + index.eventsToString(morningEvents)).toBe(
    'Your calendar for this morning:\nTUES - November 19\n\t\t08:30 AM - 09:30 AM: Morning Stand up\n\t\t09:45 AM - 10:00 AM: Coffee Run\n'
  );
});

test('Get morning event when it stars before noon and ends after noon', () => {
  expect(index.eventRecipientToString('self','self','morning') + index.eventsToString(preNoonPostNoonEvent)).toBe(
    'Your calendar for this morning:\nTUES - November 19\n\t\t11:59 AM - 12:01 PM: 1 Bite Lunch Time\n'
  );
});

test('Get different team member\'s morning events', () => {
  expect(index.eventRecipientToString('Joe','self','morning') + index.eventsToString(morningEvents)).toBe(
    '<@Joe>\'s calendar for this morning:\nTUES - November 19\n\t\t08:30 AM - 09:30 AM: Morning Stand up\n\t\t09:45 AM - 10:00 AM: Coffee Run\n'
  );
});

test('Get personal day events when there are multiple events', () => {
  expect(index.eventRecipientToString('self','self','today') + index.eventsToString(dayEvents)).toBe(
    'Your calendar for today:\nTUES - November 19\n\t\t08:30 AM - 09:30 AM: Morning Stand up\n\t\t12:45 PM - 01:00 PM: Afternoon hang\n'
  );
});

test('Get personal day with 1 event', () => {
  expect(index.eventRecipientToString('self','self','today') + index.eventsToString(fullDayEvent)).toBe(
    'Your calendar for today:\nTUES - November 19\n\t\t08:30 AM - 04:30 PM: Full Day Event\n'
  );
});

test('Get team member\'s day events when there are multiple events', () => {
  expect(index.eventRecipientToString('Joe','self','today') + index.eventsToString(dayEvents)).toBe(
    '<@Joe>\'s calendar for today:\nTUES - November 19\n\t\t08:30 AM - 09:30 AM: Morning Stand up\n\t\t12:45 PM - 01:00 PM: Afternoon hang\n'
  );
});

test('Get team member\'s day with 1 event', () => {
  expect(index.eventRecipientToString('Joe','self','today') + index.eventsToString(fullDayEvent)).toBe(
    '<@Joe>\'s calendar for today:\nTUES - November 19\n\t\t08:30 AM - 04:30 PM: Full Day Event\n'
  );
});

test('Get personal week events when there are multiple events', () => {
  expect(index.eventRecipientToString('self','self','week') + index.eventsToString(weekEvents)).toBe(
    'Your calendar for the week:\nTUES - November 26\n\t\t08:30 AM - 09:30 AM: Weekly Stand up\nTHURS - November 28\n\t\t12:45 PM - 01:00 PM: Afternoon hang\n'
  );
});

test('Get personal week events with 1 event', () => {
  expect(index.eventRecipientToString('self','self','week') + index.eventsToString(preNoonPostNoonEvent)).toBe(
    'Your calendar for the week:\nTUES - November 19\n\t\t11:59 AM - 12:01 PM: 1 Bite Lunch Time\n'
  );
});

test('Get team member\'s week events when there are multiple events', () => {
  expect(index.eventRecipientToString('Joe','self','week') + index.eventsToString(weekEvents)).toBe(
    '<@Joe>\'s calendar for the week:\nTUES - November 26\n\t\t08:30 AM - 09:30 AM: Weekly Stand up\nTHURS - November 28\n\t\t12:45 PM - 01:00 PM: Afternoon hang\n'
  );
});

test('Get team member\'s week events with 1 event', () => {
  expect(index.eventRecipientToString('Joe','self','week') + index.eventsToString(preNoonPostNoonEvent)).toBe(
    '<@Joe>\'s calendar for the week:\nTUES - November 19\n\t\t11:59 AM - 12:01 PM: 1 Bite Lunch Time\n'
  );
});

test('Get week events when weekdays carry over into a different month', () => {
  expect(index.eventsToString(weekIntoNewMonthEvents)).toBe(
    'THURS - October 31\n\t\t09:30 AM - 10:30 AM: End of month event\nFRI - November 1\n\t\t01:45 PM - 02:00 PM: Start of month event\n'
  );
});

test('Get personal free time with no events for the day', () => {
  expect(index.eventRecipientToString('self','self','free') + index.freeTimeToString(emptyEventList)).toBe(
    'Your free time for today:\n\t\tYou\'re free all day!'
  );
});

test('Get personal free time with 1 event for the day', () => {
  expect(index.eventRecipientToString('self','self','free') + index.freeTimeToString(preNoonPostNoonEvent)).toBe(
    'Your free time for today:\nTUES - November 19\n\t\t08:00 AM - 11:59 AM\n\t\t12:01 PM - 04:30 PM'
  );
});

test('Get personal free time with multiple events for the day', () => {
  expect(index.eventRecipientToString('self','self','free') + index.freeTimeToString(dayEvents)).toBe(
    'Your free time for today:\nTUES - November 19\n\t\t08:00 AM - 08:30 AM\n\t\t09:30 AM - 12:45 PM\n\t\t01:00 PM - 04:30 PM'
  );
});

test('Get team member\'s free time with no events for the day', () => {
  expect(index.eventRecipientToString('Joe','self','free') + index.freeTimeToString(emptyEventList)).toBe(
    '<@Joe>\'s free time for today:\n\t\tYou\'re free all day!'
  );
});

test('Get team member\'s free time with 1 event for the day', () => {
  expect(index.eventRecipientToString('Joe','self','free') + index.freeTimeToString(preNoonPostNoonEvent)).toBe(
    '<@Joe>\'s free time for today:\nTUES - November 19\n\t\t08:00 AM - 11:59 AM\n\t\t12:01 PM - 04:30 PM'
  );
});

test('Get team member\'s free time with multiple events for the day', () => {
  expect(index.eventRecipientToString('Joe','self','free') + index.freeTimeToString(dayEvents)).toBe(
    '<@Joe>\'s free time for today:\nTUES - November 19\n\t\t08:00 AM - 08:30 AM\n\t\t09:30 AM - 12:45 PM\n\t\t01:00 PM - 04:30 PM'
  );
});

test('Get username from message', () => {
  expect(index.getUserFromMessage('calendar week <@username>')).toBe('username');
});

test('Get Current Date', () => {
  expect(index.getCurrentDate()).toBeDefined();
});

test('Days away date', () => {
  expect(index.getDaysAwayDate(10)).toBeDefined();
});

test('Append a zero to beginning of day', () => {
  expect(index.dateAppendZero(5)).toBe('05');
});

test('Convert time from 24 hours to 12hour AM/PM from full date-time', () => {
  expect(index.parseTimeOfEvent('2019-11-07T13:10:22')).toBe('01:10 PM');
});

test('Convert time from 24 hours to 12hour AM/PM from full date-time', () => {
  expect(index.parseTimeOfEvent('2019-11-07T00:30:00')).toBe('12:30 AM');
});

test('Get weekday from index number', () => {
  expect(index.parseWeekdayOfEvent(2)).toBe('TUES');
});

test('Get month from index number', () => {
  expect(index.parseMonthOfEvent(2)).toBe('March');
});
