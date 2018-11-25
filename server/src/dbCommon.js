const QUERY_LIMIT = 6;
const PRIVATE_ACCESS = 0;
const PROTECTED_ACCESS = 1;
const PUBLIC_ACCESS = 2;
const DEFAULT_ACCESS = 1;
const RENDER_RAW = 0;
const RENDER_MD = 1;
const RENDER_HTML = 2;

module.exports = {
  QUERY_LIMIT,
  PRIVATE_ACCESS,
  PROTECTED_ACCESS,
  PUBLIC_ACCESS,
  DEFAULT_ACCESS,
  RENDER_RAW,
  RENDER_MD,
  RENDER_HTML,

  dateToEpochSecs: dateStr => Math.round(Date.parse(dateStr) / 1000),

  /**
   * Pad quotes in a string so we can store in in the db.
   */
  escapeQuotes: str => str.replace(/'/g, '\\\''),

  getCreateOptions: (opts) => {
    const defaults = {
      access: DEFAULT_ACCESS,
      renderHint: RENDER_RAW,
    };

    if (!opts) {
      return defaults;
    }
    return Object.assign(defaults, opts);
  },

  getEpochSeconds: () => Math.round((new Date()).getTime() / 1000),

  requireInt(x, fieldNameDesc) {
    if (typeof x !== 'number') {
      throw new Error(`expecting number for ${fieldNameDesc}, got ${typeof x}`);
    } else if (x % 1 !== 0) {
      throw new Error(`expecting integer for ${fieldNameDesc}, got ${x}`);
    }
  },
};
