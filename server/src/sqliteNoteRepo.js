const debug = require('debug')('sqliteNoteRepo');
const errors = require('debug')('sqliteNoteRepo:error');
const sqlite3 = require('sqlite3-promise').verbose();
const utils = require('./dbCommon');
const Query = require('./queryParser');

const queryLimit = 6;
const privateAccess = 0;
const protectedAccess = 1;
const publicAccess = 2;
const defaultAccess = protectedAccess;

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
   * Check the secret against the user id.
   * TODO: add salt
   */
  async checkSecret(secret, user) {
    const query = `SELECT secret FROM users WHERE ${user} = rowid`;
    return this.db.allAsync(query)
      .then((result) => {
        const ok = result.length > 0
          && result[0].secret === utils.escapeQuotes(secret);
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
    const escapedContent = utils.escapeQuotes(content);
    const epochS = utils.getEpochSeconds();
    const query = `INSERT INTO notes(author, content, created, privacy) VALUES (${user}, '${escapedContent}', ${epochS}, ${defaultAccess})`;
    debug(query);
    return this.db.runAsync(query)
      .then(() => this.lastId());
  }

  /**
   * Create a new user, returning the associated id.
   */
  async createUser(userName, secret) {
    debug('createUser', userName);
    const escapedUserName = utils.escapeQuotes(userName);
    const escapedSecret = utils.escapeQuotes(secret);
    let query = `INSERT INTO users(userName, secret) VALUES ('${escapedUserName}', '${escapedSecret}') `;
    let result;
    debug(query);
    return this.db.runAsync(query)
      .then(() => this.lastId())
      .then((id) => {
        result = id;
        query = `INSERT INTO sharing (user, sharesWith) VALUES (${result}, ${result})`;
        debug(query);
        return this.db.runAsync(query);
      })
      .then(() => result);
  }

  /**
   * Retrieve a promise of note content.
   */
  async getNote(noteId, user) {
    debug('getNote', noteId, user);
    const query = 'SELECT DISTINCT notes.author, notes.content, notes.created, notes.ROWID as id, notes.privacy, notes.renderHint '
      + `FROM notes, sharing WHERE id=${noteId} `
      + `AND (notes.privacy=${publicAccess} OR author=${user} OR (notes.privacy=${protectedAccess} AND sharing.user=notes.author AND sharing.sharesWith=${user}))`;
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
    const query = `SELECT ROWID FROM users WHERE userName = '${utils.escapeQuotes(userName)}'`;
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
   * @param searchTerms array whose first element matches a content search,
   *  and subsequent elements are pairs of keywords and terms to match, e.g.
   *  [ '%todos%', ['author': 'Bilbo'], ['before': '1914-08-07'] ]
   */
  async searchNote(searchTerms, user) {
    debug('searchNote', searchTerms, user);
    const queryTerms = Query.parse(searchTerms);
    const contentQuery = Query.condition('content', queryTerms[0]);
    const conditionsPromises = Promise.all(
      queryTerms.slice(1)
        .map((keyTerm) => {
          if (keyTerm[0] === 'author') {
            return this.getUserId(keyTerm[1])
              .then(id => ['author', id]);
          }
          return Promise.resolve(keyTerm);
        }),
    )
      .then(conditions => conditions.map(keyTerm => Query.condition(keyTerm[0], keyTerm[1], 'created')));

    return conditionsPromises.then((conditions) => {
      const contentQueryAnd = contentQuery.length && conditions.length
        ? `${contentQuery} AND`
        : contentQuery;
      const query = `SELECT DISTINCT notes.rowid FROM notes, sharing WHERE ${contentQueryAnd} `
       + `${conditions.join(' AND ')} `
       + `AND (privacy=${publicAccess} OR author=${user} OR (privacy=${protectedAccess} AND user=author AND sharesWith=${user})) `
       + `ORDER BY notes.rowid DESC LIMIT ${queryLimit}`;
      debug(query);
      return this.db.allAsync(query)
        .then(result => result.map(entry => entry.rowid));
    });
  }

  async setNoteAccess(noteId, user, accessMode) {
    const query = `UPDATE notes SET privacy=${accessMode} WHERE rowid=${noteId} AND author=${user}`;
    debug('setPrivate', query);
    return this.db.runAsync(query);
  }

  async setNotePrivate(noteId, user) {
    return this.setNoteAccess(noteId, user, privateAccess);
  }

  async setNoteProtected(noteId, user) {
    return this.setNoteAccess(noteId, user, protectedAccess);
  }

  async setNotePublic(noteId, user) {
    return this.setNoteAccess(noteId, user, publicAccess);
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
    const query = `DELETE FROM sharing WHERE user=${userId} AND sharesWith=${friendId}`;
    debug('userBlocks', query);
    return this.db.runAsync(query);
  }

  async userSharesWith(userId, friendId) {
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
