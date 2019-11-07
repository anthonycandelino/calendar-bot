const index = require('./index');

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
