module.exports = {
  /**
   * Pad quotes in a string so we can store in in the db.
   */
	escapeQuotes: (str) => {
		return str.replace(/'/g, '\\\'');
	},

  getEpochSeconds: () => {
    return Math.round((new Date()).getTime() / 1000);
  }
}
