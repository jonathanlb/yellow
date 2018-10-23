const dbs = require('../src/dbCommon');

describe('DB Common Utilities', () => {
  test('Assigns default note create options', () => {
    const opts = dbs.getCreateOptions();
    expect(opts.access).toEqual(dbs.PROTECTED_ACCESS);
    expect(opts.renderHint).toEqual(dbs.RENDER_RAW);
  });

  test('Overwrites default note create options', () => {
    const opts = dbs.getCreateOptions({ renderHint: dbs.RENDER_MD });
    expect(opts.access).toEqual(dbs.PROTECTED_ACCESS);
    expect(opts.renderHint).toEqual(dbs.RENDER_MD);
  });
});
