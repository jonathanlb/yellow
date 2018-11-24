const bcrypt = require('bcrypt');
const debug = require('debug')('pgRepo');
const errors = require('debug')('pgRepo:error');
const os = require('os');
const pg = require('pg-promise');
const dbs = require('./dbCommon');
const Query = require('./queryParser');

const SALT_ROUNDS = 10;

/**
 * Note repository upon postgres.
 */
module.exports = class PgRepo {
  constructor(opts) {
    this.dbConfig = Object.assign(
      {
        database: 'yellow',
        host: 'localhost',
        port: 5432,
        user: os.userInfo().username,
      },
      opts,
    );
  }

  /**
   * Check the secret against the user id.
   */
  async checkSecret(secret, user) {
    debug('checkSecret', user);
    const query = `SELECT secret FROM users WHERE ${user} = id`;
    debug(query);
    const result = await this.db.one(query);
    const ok = result
      && bcrypt.compare(result.secret, secret);
    debug('checkSecret', ok);
    return ok;
  }

  // eslint-disable-next-line class-methods-use-this
  close() {
  }

  /**
   * Insert a new note into the repository returning a promise to the note
   * id.
   */
  async createNote(content, user, opts) {
    debug('createNote', content, user);
    const escapedContent = dbs.escapeQuotes(content);
    const epochS = dbs.getEpochSeconds();
    const { access, renderHint } = dbs.getCreateOptions(opts);
    const query = 'INSERT INTO notes(author, content, created, privacy, renderHint)'
      + ` VALUES (${user}, '${escapedContent}', ${epochS}, ${access}, ${renderHint})`
      + ' RETURNING id';
    debug(query);
    return this.db.one(query)
      .then(row => row.id);
  }

  async createUser(userName, secret) {
    debug('createUser', userName);
    const escapedUserName = dbs.escapeQuotes(userName);
    const escapedSecret = await bcrypt.hash(secret, SALT_ROUNDS);
    const query = 'INSERT INTO users(userName, secret) '
      + `values ('${escapedUserName}', '${escapedSecret}') RETURNING id`;
    debug(query);
    return this.db.one(query)
      .then(row => row.id);
  }

  /**
   * Retrieve a promise of note content.
   */
  async getNote(noteId, user) {
    debug('getNote', noteId, user);
    const query = 'SELECT author, content, created, id FROM notes '
      + `WHERE id = ${noteId}`;
    debug(query);
    return this.db.oneOrNone(query);
  }

  async getUserId(userName) {
    debug('getUserId', userName);
    const query = 'SELECT id FROM users '
      + `WHERE userName = '${dbs.escapeQuotes(userName)}'`;
    debug(query);
    return this.db.oneOrNone(query)
      .then(result => result.id);
  }

  async getUserName(userId) {
    debug('getUserName', userId);
    const query = `SELECT userName FROM users WHERE id = ${userId}`;
    debug(query);
    return this.db.oneOrNone(query)
      .then(result => result.username); // pg clobbers column-name case.
  }

  /**
   * Return the list of names that the user shares with.
   */
  async getUserSharesWith(userId) {
    const query = 'SELECT DISTINCT users.userName FROM sharing, users '
      + `WHERE sharing.author = ${userId} AND users.id = sharing.sharesWith AND users.id <> ${userId}`;
    return this.db.any(query)
      .then(results => results.map((x) => {
        debug('getUserSharesWith', userId, x);
        return x.username;
      }));
  }

  /**
   * Delete note content, returning a promise of success.
   */
  async removeNote(noteId, user) {
    debug('removeNote', noteId, user);
    const query = `DELETE FROM notes WHERE id = ${noteId} AND author = ${user}`;
    debug(query);
    return this.db.none(query);
  }

  /**
   * Return a promise to an array of note ids.
   *
   * @param searchTerms text for search "content like '$searchTerms'"
   *
   * TODO: implement following
   * @param searchTerms array whose first element matches a content search,
   *  and subsequent elements are pairs of keywords and terms to match, e.g.
   *  [ '%todos%', ['author': 'Bilbo'], ['before': '1914-08-07'] ]

   */
  async searchNote(searchTerms, user) {
    debug('search', user, searchTerms);
    const queryOpt = {
      table: 'n',
    };
    const queryTerms = Query.parse(searchTerms);
    const contentQuery = Query.condition('content', queryTerms[0], queryOpt);
    const conditionsPromises = Query.promiseTerms(
      queryTerms, userName => this.getUserId(userName), queryOpt,
    );

    return conditionsPromises.then((conditions) => {
      const contentQueryAnd = contentQuery.length && conditions.length
        ? `${contentQuery} AND`
        : contentQuery;
      const query = 'SELECT DISTINCT n.id FROM notes as n, sharing as s '
        + `WHERE ${contentQueryAnd} ${conditions.join(' AND ')} `
        + `AND (n.privacy=${dbs.PUBLIC_ACCESS} OR n.author=${user} OR (n.privacy=${dbs.PROTECTED_ACCESS} AND n.author=s.author AND s.sharesWith=${user})) `
        + `ORDER BY n.id DESC LIMIT ${dbs.QUERY_LIMIT}`;
      debug(query);
      return this.db.any(query)
        .then(results => results.map(row => row.id));
    });
  }

  async setNoteAccess(noteId, user, accessMode) {
    const query = `UPDATE notes SET privacy=${accessMode} WHERE id=${noteId} AND author=${user}`;
    debug('setPrivate', query);
    return this.db.one(query);
  }

  async setNotePrivate(noteId, user) {
    return this.setNoteAccess(noteId, user, dbs.PRIVATE_ACCESS);
  }

  async setNoteProtected(noteId, user) {
    return this.setNoteAccess(noteId, user, dbs.PROTECTED_ACCESS);
  }

  async setNotePublic(noteId, user) {
    return this.setNoteAccess(noteId, user, dbs.PUBLIC_ACCESS);
  }

  async setup() {
    this.db = pg({})(
      `postgres://${this.dbConfig.user}@${this.dbConfig.host}:${this.dbConfig.port}/${this.dbConfig.database}`,
    );

    const dbErrors = [];

    return [
      'CREATE TABLE IF NOT EXISTS notes (author INT, content TEXT, created INT, id SERIAL PRIMARY KEY, privacy INT, renderHint INT)',
      'CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, secret TEXT, userName TEXT)',
      'CREATE TABLE IF NOT EXISTS sharing (author INT NOT NULL, sharesWith INT NOT NULL, UNIQUE(author, sharesWith))',
      'CREATE INDEX IF NOT EXISTS idx_shares_with ON sharing (sharesWith)',
      'CREATE INDEX IF NOT EXISTS idx_sharing_users ON sharing (author)',
    ].reduce(
      (accum, query) => {
        debug('setup', query);
        return accum.then(() => this.db.none(query))
          .catch(e => dbErrors.push(e));
      },
      Promise.resolve(true),
    ).then(() => {
      if (dbErrors.length) {
        dbErrors.forEach((e, i) => errors('Cannot setup DB', i, e.message));
        throw (dbErrors[0]);
      }
    });
  }

  async userBlocks(userId, friendId) {
    const query = `DELETE FROM sharing WHERE author=${userId} AND sharesWith=${friendId}`;
    debug('userBlocks', query);
    return this.db.one(query);
  }

  async userSharesWith(userId, friendId) {
    const query = `INSERT INTO sharing (author, sharesWith) VALUES (${userId}, ${friendId})`;
    debug('userSharesWith', query);
    return this.db.one(query)
      .catch((error) => {
        if (!error.message.includes('duplicate key value violates unique constraint')) {
          throw error;
        }
      });
  }
};
