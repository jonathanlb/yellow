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
    const query = `INSERT INTO notes(content, user) values ('${escapedContent}', ${user})`;
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
    const query = `SELECT content FROM notes WHERE ROWID = ${noteId}`;
    debug(query);
    return this.db.allAsync(query)
      .then((x) => {
        debug('GET', x);
        if (x.length > 0) {
          return x[0].content;
        }
        return undefined;
      });
  }

  async getUser(userName) {
    debug('getUser', userName);
    const query = `SELECT ROWID FROM users WHERE userName = '${SqliteNoteRepo.escapeQuotes(userName)}'`;
    debug(query);
    return this.db.allAsync(query)
      .then((x) => {
        debug('GET', x);
        return x[0].rowid;
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
   */
  async removeNote(noteId, user) {
    debug('removeNote', noteId, user);
    const query = `DELETE FROM notes WHERE rowid = ${noteId} AND user = ${user}`;
    debug(query);
    return this.db.allAsync(query);
  }

  /**
   * Return a promise to an array of note ids.
   */
  async searchNote(searchTerms, user) {
    debug('searchNote', searchTerms, user);
  }

  /**
   * Set up the tables
   */
  async setup() {
    const createNotes = 'CREATE TABLE IF NOT EXISTS notes(user INT, content TEXT)';
    debug('setup', createNotes);
    return this.db.runAsync(createNotes)
      .then(() => {
        const createUsers = 'CREATE TABLE IF NOT EXISTS users(userName TEXT, secret TEXT)';
        debug('setup', createUsers);
        return this.db.runAsync(createUsers);
      });
  }
};
