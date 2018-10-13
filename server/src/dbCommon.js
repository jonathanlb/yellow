module.exports = {
  QUERY_LIMIT: 6,
  PRIVATE_ACCESS: 0,
  PROTECTED_ACCESS: 1,
  PUBLIC_ACCESS: 2,
  DEFAULT_ACCESS: 1,

  dateToEpochSecs: dateStr => Math.round(Date.parse(dateStr) / 1000),

  /**
   * Pad quotes in a string so we can store in in the db.
   */
  escapeQuotes: str => str.replace(/'/g, '\\\''),

  getEpochSeconds: () => Math.round((new Date()).getTime() / 1000),
};
