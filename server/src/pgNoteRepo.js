const debug = require('debug')('pgRepo');
const errors = require('debug')('pgRepo:error');
const pg = require('pg-promise');
const utils = require('./dbCommon');

const default_dbName = 'yellow';
const default_userName = 'u0_a62';

/**
 * Note repository upon postgres.
 */
module.exports = class PgRepo {
  constructor() {
    this.dbConfig = {
      database: default_dbName,
      host: 'localhost',
      port: 5432,
      user: default_userName,
    };

    this.db = pg({})(
      `postgres://${this.dbConfig.user}@${this.dbConfig.host}:${this.dbConfig.port}/${this.dbConfig.database}`,
    );
  }

  /**
   * Check the secret against the user id.
   */
  async checkSecret(secret, user) {
    return true;
  }

  close() {
  }

  /**
   * Insert a new note into the repository returning a promise to the note
   * id.
   */
  async createNote(content, user) {
    debug('createNote', content, user);
    const escapedContent = utils.escapeQuotes(content);
    const epochS = utils.getEpochSeconds();
    const query = `INSERT INTO notes(author, content, created) values (${user}, '${escapedContent}', ${epochS}) RETURNING id`;
    debug(query);
    return this.db.one(query)
      .then(row => row.id);
  }

  async createUser(userName, secret) {
    debug('createUser', userName);
    const escapedUserName = utils.escapeQuotes(userName);
    const escapedSecret = utils.escapeQuotes(secret);
    const query = `INSERT INTO users(userName, secret) values ('${escapedUserName}', '${escapedSecret}') RETURNING id`;
    debug(query);
    return this.db.one(query)
      .then(row => row.id);
  }

  /**
   * Retrieve a promise of note content.
   */
  async getNote(noteId, user) {
    debug('getNote', noteId, user);
    const query = `SELECT author, content, created, id FROM notes WHERE id = ${noteId}`;
    debug(query);
    return this.db.oneOrNone(query);
  }

  async getUserId(userName) {
    debug('getUserId', userName);
    const query = `SELECT id FROM users WHERE userName = '${utils.escapeQuotes(userName)}'`;
    debug(query);
    return this.db.oneOrNone(query);
  }

  async getUserName(userId) {
    debug('getUserName', userId);
    const query = `SELECT userName FROM users WHERE id = ${userId}`;
    debug(query);
    return this.db.oneOrNone(query);
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
   */
  async searchNote(searchTerms, user) {
    debug('search', searchTerms, user);
    const query = `SELECT id FROM notes WHERE ${searchTerms}`;
    return this.db.any(query)
      .map(row => row.id);
  }

  async setup() {
    const createNotes = 'CREATE TABLE IF NOT EXISTS notes(author INT, content TEXT, created INT, id SERIAL PRIMARY KEY)';
    debug('setup', createNotes);
    return this.db.none(createNotes)
      .then(() => {
        const createUsers = 'CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY, secret TEXT, userName TEXT)';
        debug('setup', createUsers);
        return this.db.none(createUsers);
      });
  }
};
