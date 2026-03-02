module.exports = jest.fn(() => ({
  start: jest.fn(),
  succeed: jest.fn(),
  fail: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  stop: jest.fn(),
  text: '',
  color: '',
  spinner: {},
}));
