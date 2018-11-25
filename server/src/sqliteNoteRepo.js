const bcrypt = require('bcrypt');
const debug = require('debug')('sqliteNoteRepo');
const errors = require('debug')('sqliteNoteRepo:error');
const sqlite3 = require('sqlite3-promise').verbose();
const dbs = require('./dbCommon');
const Query = require('./queryParser');

const SALT_ROUNDS = 10;
/**
 * Note repository upon SqLite3.
 * Does not work from ChromeOS -- "relocatable text" error upon
 * sqlite3 module load.
 */
module.exports = class SqliteNoteRepo {
  constructor(opts) {
    const fileOrMemory = opts.file || ':memory:';
    this.db = new sqlite3.Database(
      fileOrMemory,
      sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, // eslint-disable-line no-bitwise
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
   * Check the secret against the user id.
   */
  async checkSecret(secret, user) {
    const query = `SELECT secret FROM users WHERE ${user} = rowid`;
    dbs.requireInt(user, 'checkSecret:user');
    const result = await this.db.allAsync(query);
    debug('checkSecret', result);
    const ok = result.length > 0
      && bcrypt.compare(secret, result[0].secret);
    debug('checkSecret', ok);
    return ok;
  }

  close() {
    this.db.close();
  }

  /**
   * Insert a new note into the repository returning a promise to the note
   * id.
   */
  async createNote(content, user, opts) {
    debug('createNote', content, user);
    dbs.requireInt(user, 'createNote:user');
    const escapedContent = dbs.escapeQuotes(content);
    const epochS = dbs.getEpochSeconds();
    const { access, renderHint } = dbs.getCreateOptions(opts);
    const query = 'INSERT INTO notes(author, content, created, privacy, renderHint)'
      + ` VALUES (${user}, '${escapedContent}', ${epochS}, ${access}, ${renderHint})`;
    debug(query);
    return this.db.runAsync(query)
      .then(() => this.lastId());
  }

  /**
   * Create a new user, returning the associated id.
   */
  async createUser(userName, secret) {
    debug('createUser', userName);
    const escapedUserName = dbs.escapeQuotes(userName);
    const escapedSecret = await bcrypt.hash(secret, SALT_ROUNDS);
    let query = `INSERT INTO users(userName, secret) VALUES ('${escapedUserName}', '${escapedSecret}')`;
    debug(query);
    await this.db.runAsync(query);
    const result = await this.lastId();
    query = `INSERT INTO sharing (user, sharesWith) VALUES (${result}, ${result})`;
    debug(query);
    await this.db.runAsync(query);
    return result;
  }

  /**
   * Retrieve a promise of note content.
   */
  async getNote(noteId, user) {
    debug('getNote', noteId, user);
    dbs.requireInt(noteId, 'getNote:noteId');
    dbs.requireInt(user, 'getNote:user');
    const query = 'SELECT DISTINCT notes.author, notes.content, notes.created, notes.ROWID as id, notes.privacy, notes.renderHint '
      + `FROM notes, sharing WHERE id=${noteId} `
      + `AND (notes.privacy=${dbs.PUBLIC_ACCESS} OR author=${user} OR (notes.privacy=${dbs.PROTECTED_ACCESS} AND sharing.user=notes.author AND sharing.sharesWith=${user}))`;
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
   * Return promise of -1 on lookup failure, for the moment...
   */
  async getUserId(userName) {
    debug('getUserId', userName);
    const query = `SELECT ROWID FROM users WHERE userName = '${dbs.escapeQuotes(userName)}'`;
    debug(query);
    return this.db.allAsync(query)
      .then((x) => {
        debug('GET', x);
        if (x && x.length) {
          return x[0].rowid;
        }
        return -1;
      });
  }

  /**
   * Return a promise to the user name.
   */
  async getUserName(userId) {
    debug('getUserName', userId);
    dbs.requireInt(userId, 'getUserName:userId');
    const query = `SELECT userName FROM users WHERE ROWID = ${userId}`;
    debug(query);
    return this.db.allAsync(query)
      .then((x) => {
        debug('GET', x);
        return x[0].userName;
      });
  }

  /**
   * Return the list of names that the user shares with.
   */
  async getUserSharesWith(userId) {
    dbs.requireInt(userId, 'getUserSharesWith:userId');
    const query = 'SELECT DISTINCT users.userName FROM sharing, users '
      + `WHERE sharing.user = ${userId} AND users.ROWID = sharing.sharesWith AND users.ROWID <> ${userId}`;
    return this.db.allAsync(query)
      .then(results => results.map((x) => {
        debug('getUserSharesWith', userId, x);
        return x.userName;
      }));
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
    dbs.requireInt(noteId, 'removeNote:noteId');
    dbs.requireInt(user, 'removeNote:user');
    const query = `DELETE FROM notes WHERE rowid = ${noteId} AND author = ${user}`;
    debug(query);
    return this.db.allAsync(query);
  }

  /**
   * Return a promise to an array of note ids.
   * @param searchTerms array whose first element matches a content search,
   *  and subsequent elements are pairs of keywords and terms to match, e.g.
   *  [ '%todos%', ['author': 'Bilbo'], ['before': '1914-08-07'] ]
   */
  async searchNote(searchTerms, user) {
    debug('searchNote', searchTerms, user);
    dbs.requireInt(user, 'searchNote:user');
    const queryTerms = Query.parse(searchTerms);
    const contentQuery = Query.condition('content', queryTerms[0]);
    const conditionsPromises = Query.promiseTerms(
      queryTerms, userName => this.getUserId(userName),
    );

    return conditionsPromises.then((conditions) => {
      const contentQueryAnd = contentQuery.length && conditions.length
        ? `${contentQuery} AND`
        : contentQuery;
      const query = `SELECT DISTINCT notes.rowid FROM notes, sharing WHERE ${contentQueryAnd} `
       + `${conditions.join(' AND ')} `
       + `AND (privacy=${dbs.PUBLIC_ACCESS} OR author=${user} OR (privacy=${dbs.PROTECTED_ACCESS} AND user=author AND sharesWith=${user})) `
       + `ORDER BY notes.rowid DESC LIMIT ${dbs.QUERY_LIMIT}`;
      debug(query);
      return this.db.allAsync(query)
        .then(result => result.map(entry => entry.rowid));
    });
  }

  async setNoteAccess(noteId, user, accessMode) {
    dbs.requireInt(noteId, 'setNoteAccess:noteId');
    dbs.requireInt(user, 'setNoteAccess:user');
    dbs.requireInt(accessMode, 'setNoteAccess:accessMode');
    const query = `UPDATE notes SET privacy=${accessMode} WHERE rowid=${noteId} AND author=${user}`;
    debug('setNoteAccess', query);
    return this.db.runAsync(query);
  }

  async setNotePrivate(noteId, user) {
    dbs.requireInt(noteId, 'setNotePrivate:noteId');
    dbs.requireInt(user, 'setNotePrivate:user');
    return this.setNoteAccess(noteId, user, dbs.PRIVATE_ACCESS);
  }

  async setNoteProtected(noteId, user) {
    dbs.requireInt(noteId, 'setNoteProtected:noteId');
    dbs.requireInt(user, 'setNoteProtected:user');
    return this.setNoteAccess(noteId, user, dbs.PROTECTED_ACCESS);
  }

  async setNotePublic(noteId, user) {
    dbs.requireInt(noteId, 'setNotePublic:noteId');
    dbs.requireInt(user, 'setNotePublic:user');
    return this.setNoteAccess(noteId, user, dbs.PUBLIC_ACCESS);
  }

  /**
   * Set up the tables
   */
  async setup() {
    return [
      'CREATE TABLE IF NOT EXISTS notes (author INT, content TEXT, created INT, privacy INT, renderHint INT)',
      'CREATE TABLE IF NOT EXISTS users (userName TEXT, secret TEXT)',
      'CREATE TABLE IF NOT EXISTS sharing (user INT, sharesWith INT, UNIQUE(user, sharesWith))',
      'CREATE INDEX IF NOT EXISTS idx_shares_with ON sharing (sharesWith)',
      'CREATE INDEX IF NOT EXISTS idx_sharing_users ON sharing (user)',
    ].reduce(
      (accum, query) => {
        debug('setup', query);
        return accum.then(() => this.db.runAsync(query));
      },
      Promise.resolve(true),
    );
  }

  async userBlocks(userId, friendId) {
    dbs.requireInt(userId, 'userBlocks:userId');
    dbs.requireInt(friendId, 'userBlocks:friendId');
    const query = `DELETE FROM sharing WHERE user=${userId} AND sharesWith=${friendId}`;
    debug('userBlocks', query);
    return this.db.runAsync(query);
  }

  async userSharesWith(userId, friendId) {
    dbs.requireInt(userId, 'userSharesWith:userId');
    dbs.requireInt(friendId, 'userSharesWith:friendId');
    const query = `INSERT INTO sharing (user, sharesWith) VALUES (${userId}, ${friendId})`;
    debug('userSharesWith', query);
    return this.db.runAsync(query)
      .catch((error) => {
        if (!error.message.includes('UNIQUE constraint failed')) {
          throw error;
        }
      });
  }
};
