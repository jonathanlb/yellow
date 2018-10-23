const util = require('./dbCommon');

/**
 * Extract the tablename dot prefix for db queries if specified in opt.
 * @param opt object that might have a 'table' string entry.
 */
function tableNamePrefix(opt) {
  if (opt && opt.table) {
    return `${opt.table}.`;
  }
  return '';
}

function conditionAfter(term, opt) {
  return `${tableNamePrefix(opt)}${opt.timeColumn} > ${util.dateToEpochSecs(term)}`;
}

function conditionBefore(term, opt) {
  return `${tableNamePrefix(opt)}${opt.timeColumn} < ${util.dateToEpochSecs(term)}`;
}

function condition(keyword, term, opt) {
  if (term.length === 0) {
    return '';
  } if (keyword === 'after') {
    return conditionAfter(term, opt);
  } if (keyword === 'before') {
    return conditionBefore(term, opt);
  }

  const typeOfTerm = typeof term;
  switch (typeOfTerm) {
    case 'number':
      return `${tableNamePrefix(opt)}${keyword} = ${term}`;
    case 'string':
      if (term.includes('%')) {
        return `${tableNamePrefix(opt)}${keyword} like '${term}'`;
      }
      return `${tableNamePrefix(opt)}${keyword} = '${term}'`;

    default:
      throw new Error(`cannot interpret term ${term} with type ${typeOfTerm}`);
  }
}

/**
 * Parse a query string into an array whose first component is the
 * content query, and subsequent entries are filter/where clauses represented
 * pairs.
 *
 * e.g. 'keyword: foo in: inbox stuff todo' maps to
 * ['stuff todo', ['keyword', 'foo'], ['in', 'inbox']]
 *
 * TODO: protect against SQL injection
 */
function parse(query) {
  let toParse = query;
  const wheres = [];
  let m; let
    m0;

  do {
    m = toParse.match(/^\s*([A-Za-z_]*):\s*(.*)/);
    if (m) {
      const keyword = m[1];
      let rest = m[2];
      let quote = '';
      if (rest.startsWith('"') || rest.startsWith("'")) {
        quote = rest[0]; // eslint-disable-line prefer-destructuring
        const quoted = new RegExp(`${quote}([^${quote}]*)${quote}(.*)`);
        m0 = rest.match(quoted);
      } else {
        m0 = rest.match(/([^\s]+)(.*)/);
      }
      const searchTerm = m0[1];
      rest = m0[2]; // eslint-disable-line prefer-destructuring
      wheres.push([keyword, searchTerm]);
      toParse = rest || '';
    }
  } while (m && toParse.length);

  wheres.unshift(toParse.trim());
  return wheres;
}

/**
 * Convert  an array of condition promises used to filter note content.
 *
 * @param queryTerms an array containing a content query followed by
 *   keyword-search-term pairs produced by parse(), e.g.
 *   ['stuff todo', ['keyword', 'foo'], ['in', 'inbox']]
 * @param getUserId map user name to a promise of the corresponding id.
 */
function promiseTerms(queryTerms, getUserId, opt) {
  const optWithDefault = Object.assign(
    { timeColumn: 'created' }, opt,
  );

  return Promise.all(
    queryTerms.slice(1)
      .map((keyTerm) => {
        if (keyTerm[0] === 'author') {
          return getUserId(keyTerm[1])
            .then(id => ['author', id]);
        }
        return Promise.resolve(keyTerm);
      }), // eslint-disable-next-line
  ).then(conditions =>                             // eslint-disable-next-line
	    conditions.map(keyTerm =>                    // eslint-disable-next-line
	      condition(keyTerm[0], keyTerm[1], optWithDefault)));
}

module.exports = {
  condition, parse, promiseTerms,
};
