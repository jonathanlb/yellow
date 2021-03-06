const Query = require('../src/queryParser');

describe('Query parser', () => {
  it('builds after conditions', () => {
    expect(Query.condition('after', '2018-09-07', {timeColumn: 'time'}))
      .toEqual('time > 1536278400');
  });

  it('builds before conditions', () => {
    expect(Query.condition('before', '2018-09-07', {timeColumn: 'created'}))
      .toEqual('created < 1536278400');
  });

  it('builds string equality conditions', () => {
      expect(Query.condition('author', 'bilbo'))
        .toEqual('author = \'bilbo\'');
  });

  it('builds numerical equality conditions', () => {
      expect(Query.condition('author', 5))
        .toEqual('author = 5');
  });

  it('builds like conditions', () => {
    expect(Query.condition('content', '%ish'))
      .toEqual('content like \'%ish\'');
  });

	it('builds a promise of search terms', () => {
		function getUserId(userName) {
			return Promise.resolve(19);
		}
		const opt = { table: 'notes' };
		const queryTerms = ['todo', ['author', 'bilbo'], ['before', '2017-06-09']];

		Query.promiseTerms(queryTerms, getUserId, opt)
			.then((p) => 
				expect(p).toEqual(['notes.author = 19', 'notes.created < 1496966400']));
	});

  it('cannot handle object conditions', () => {
    expect(() => {
      const result = Query.condition('ish', {foo: 'bar', baz: true});
      console.error('Expecting error, but got', result);
    }).toThrowError(/cannot interpret/);
  })

  it('handles content only queries', () => {
    const query = 'where is my phone';
    const result = Query.parse(query);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([query]);
  });

  it('ignores empty conditions', () => {
    expect(Query.condition('content', ''))
      .toEqual('');
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

  it('prepends table names to string equality conditions', () => {
      expect(Query.condition('author', 'bilbo', {table: 'n'}))
        .toEqual('n.author = \'bilbo\'');
  });

});
