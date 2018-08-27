const debug = require('debug')('sqliteNoteRepo');
const errors = require('debug')('sqliteNoteRepo:error');
const sqlite3 = require('sqlite3-promise').verbose();

/**
 * Note repository upon SqLite3.
 * Does not work from ChromeOS -- "relocatable text" error upon
 * sqlite3 module load.
 */
module.exports = class SqliteNoteRepo {
  constructor(dbFile) {
    this.dbFile = dbFile;
    const fileOrMemory = dbFile || ':memory:';
    this.db = new sqlite3.Database(
      fileOrMemory,
      sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, // eslint-disable-line
      (err) => {
        if (err) {
          errors(err.message);
        } else {
          debug('Connected to the in-memory SQlite database:', fileOrMemory);
        }
      },
    );
  }

  /**
   * Pad quotes in a string so we can store in in the db.
   */
  static escapeQuotes(str) {
    return str.replace(/'/g, '\\\'');
  }

  /**
   * Check the secret against the user id.
   * TODO: add salt
   */
  async checkSecret(secret, user) {
    const query = `SELECT secret FROM users WHERE ${user} = rowid`;
    return this.db.allAsync(query)
      .then((result) => {
        const ok = result.length > 0
          && result[0].secret === SqliteNoteRepo.escapeQuotes(secret);
        debug('checkSecret', ok);
        return ok;
      });
  }

  close() {
    this.db.close();
  }

  /**
   * Insert a new note into the repository returning a promise to the note
   * id.
   */
  async createNote(content, user) {
    debug('createNote', content, user);
    const escapedContent = SqliteNoteRepo.escapeQuotes(content);
    const epochS = Math.round((new Date()).getTime() / 1000);
    const query = `INSERT INTO notes(author, content, created) values (${user}, '${escapedContent}', ${epochS})`;
    debug(query);
    return this.db.runAsync(query)
      .then(() => this.lastId());
  }

  /**
   * Create a new user, returning the associated id.
   */
  async createUser(userName, secret) {
    debug('createUser', userName);
    const escapedUserName = SqliteNoteRepo.escapeQuotes(userName);
    const escapedSecret = SqliteNoteRepo.escapeQuotes(secret);
    const query = `INSERT INTO users(userName, secret) values ('${escapedUserName}', '${escapedSecret}')`;
    debug(query);
    return this.db.runAsync(query)
      .then(() => this.lastId());
  }

  /**
   * Retrieve a promise of note content.
   */
  async getNote(noteId, user) {
    debug('getNote', noteId, user);
    const query = `SELECT author, content, created, ROWID as id FROM notes WHERE ROWID = ${noteId}`;
    debug(query);
    return this.db.allAsync(query)
      .then((x) => {
        debug('GET', x);
        if (x.length > 0) {
          return x[0];
        }
        return undefined;
      });
  }

  /**
   * Return a promise returning the user id from the user name.
   */
  async getUserId(userName) {
    debug('getUserId', userName);
    const query = `SELECT ROWID FROM users WHERE userName = '${SqliteNoteRepo.escapeQuotes(userName)}'`;
    debug(query);
    return this.db.allAsync(query)
      .then((x) => {
        debug('GET', x);
        return x[0].rowid;
      });
  }

  /**
   * Return a promise to the user name.
   */
  async getUserName(userId) {
    debug('getUserName', userId);
    const query = `SELECT userName FROM users WHERE ROWID = ${userId}`;
    debug(query);
    return this.db.allAsync(query)
      .then((x) => {
        debug('GET', x);
        return x[0].userName;
      });
  }

  async lastId() {
    return this.db.allAsync('SELECT last_insert_rowid()')
      .then((x) => {
        debug('last', x);
        return x[0]['last_insert_rowid()'];
      });
  }

  /**
   * Delete note content, returning a promise of success.
   * Only the author should be able to remove the note.
   */
  async removeNote(noteId, user) {
    debug('removeNote', noteId, user);
    const query = `DELETE FROM notes WHERE rowid = ${noteId} AND author = ${user}`;
    debug(query);
    return this.db.allAsync(query);
  }

  /**
   * Return a promise to an array of note ids.
   * @param searchTerms the substring completing the SQLite3 search query
   *  "SELECT rowid FROM notes WHERE ..."
   * TODO: check permissions.
   */
  async searchNote(searchTerms, user) {
    debug('searchNote', searchTerms, user);
    const query = `SELECT rowid FROM notes WHERE ${searchTerms}`;
    debug(query);
    return this.db.allAsync(query)
      .then(result => result.map(entry => entry.rowid));
  }

  /**
   * Set up the tables
   */
  async setup() {
    const createNotes = 'CREATE TABLE IF NOT EXISTS notes(author INT, content TEXT, created INT)';
    debug('setup', createNotes);
    return this.db.runAsync(createNotes)
      .then(() => {
        const createUsers = 'CREATE TABLE IF NOT EXISTS users(userName TEXT, secret TEXT)';
        debug('setup', createUsers);
        return this.db.runAsync(createUsers);
      });
  }
};
