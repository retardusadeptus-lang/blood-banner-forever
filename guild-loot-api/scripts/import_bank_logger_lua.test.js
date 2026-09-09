const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLuaBankFile } = require('./import_bank_logger_lua');

test('normalizes legacy bank categories while preserving subtypes', () => {
  const items = parseLuaBankFile(`TBCBankDB = {
    [123] = {
      ["name"] = "Test Ore",
      ["category"] = "Trade Goods",
      ["subtype"] = "Metal & Stone",
      ["count"] = 2,
    },
  }`);

  assert.deepEqual(items, [{
    item_wowhead_id: 123,
    name: 'Test Ore',
    category: 'Materials',
    count: 2,
    sub_type: 'Metal & Stone'
  }]);
});