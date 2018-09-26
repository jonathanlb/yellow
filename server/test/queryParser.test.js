const Query = require('../src/queryParser');

describe('Query parser', () => {
  it('handles content only queries', () => {
    const query = 'where is my phone';
    const result = Query.parse(query);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([query]);
  });

  it('extracts keyword queries', () => {
    const query = 'after: 2018-09-07 where is my phone';
    const result = Query.parse(query);
    expect(result).toEqual(['where is my phone', ['after', '2018-09-07']]);
  });

  it('extracts conjunction queries', () => {
    const query = 'after: 2017-01-01 before: 2018-09-07 where is my phone';
    const result = Query.parse(query);
    expect(result).toEqual([
      'where is my phone',
      ['after', '2017-01-01'],
      ['before', '2018-09-07']]);
  });

  it('extracts quoted author queries', () => {
    const query = 'author: "Jonathan Bredin" where is my phone';
    const result = Query.parse(query);
    expect(result).toEqual([
      'where is my phone',
      ['author', 'Jonathan Bredin']]);
  });

  it('extracts single quoted author queries', () => {
    const query = 'author: \'Jonathan Bredin\' after: 2017-01-01 where is my phone';
    const result = Query.parse(query);
    expect(result).toEqual([
      'where is my phone',
      ['author', 'Jonathan Bredin'],
      ['after', '2017-01-01']]);
  });
});
