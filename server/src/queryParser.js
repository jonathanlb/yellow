const util = require('./dbCommon');

function conditionAfter(term, timeColumn) {
  return `${timeColumn} > ${util.dateToEpochSecs(term)}`;
}

function conditionBefore(term, timeColumn) {
  return `${timeColumn} < ${util.dateToEpochSecs(term)}`;
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
      return `${keyword} = ${term}`;
    case 'string':
      if (term.includes('%')) {
        return `${keyword} like '${term}'`;
      }
      return `${keyword} = '${term}'`;

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

module.exports = {
  condition, parse,
};