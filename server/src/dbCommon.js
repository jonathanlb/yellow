module.exports = {
  dateToEpochSecs: dateStr => Math.round(Date.parse(dateStr) / 1000),

  /**
   * Pad quotes in a string so we can store in in the db.
   */
  escapeQuotes: str => str.replace(/'/g, '\\\''),

  getEpochSeconds: () => Math.round((new Date()).getTime() / 1000),
};
