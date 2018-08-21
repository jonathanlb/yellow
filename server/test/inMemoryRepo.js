const debug = require('debug')('inMemoryRepo');

/**
 * Note repository for unit testing only.
 */
module.exports = class InMemoryRepo {
  constructor() {
    this.content = [];
  }

  /**
   * Check the secret against the user id.
   */
  async checkSecret(secret, user) {
    return true;
  }

  /**
   * Insert a new note into the repository returning a promise to the note
   * id.
   */
  async create(content, user) {
    debug('create', content, user);
    this.content.push(content);
    return this.content.length - 1;
  }

  /**
   * Retrieve a promise of note content.
   */
  async get(noteId, user) {
    debug('get', noteId, user);
    return this.content[noteId];
  }

  /**
   * Delete note content, returning a promise of success.
   */
  async remove(noteId, user) {
    const result = this.content[noteId] !== undefined;
    debug('remove', noteId, user, result);
    this.content[noteId] = undefined;
    return result;
  }

  /**
   * Return a promise to an array of note ids.
   */
  async search(searchTerms, user) {
    debug('search', searchTerms, user);
    return this.content.filter(x => 
        x.toString().includes(searchTerms));
  }
}
