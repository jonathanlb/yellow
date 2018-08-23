const debug = require('debug')('pgRepo');
const errors = require('debug')('pgRepo:error');
const pg = require('pg-promise');


/**
 * Note repository upon postgres.
 */
module.exports = class PgRepo {
  constructor() {
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
  async create(content, user) {
    debug('create', content, user);
  }

  /**
   * Retrieve a promise of note content.
   */
  async get(noteId, user) {
    debug('get', noteId, user);
  }

  /**
   * Delete note content, returning a promise of success.
   */
  async remove(noteId, user) {
    debug('remove', noteId, user);
  }

  /**
   * Return a promise to an array of note ids.
   */
  async search(searchTerms, user) {
    debug('search', searchTerms, user);
  }
};
