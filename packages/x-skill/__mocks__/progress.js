module.exports = jest.fn(() => ({
  tick: jest.fn(),
  update: jest.fn(),
  terminate: jest.fn(),
  render: jest.fn(),
  complete: false,
  total: 100,
  curr: 0,
}));
