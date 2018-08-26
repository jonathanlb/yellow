const debug = require('debug')('inMemoryRepo');

/**
 * Note repository for unit testing only.
 */
module.exports = class InMemoryRepo {
  /**
   * Unit testing support to ensure that the repository interface methodNames
   * have definitions.
   */
  static checkMethodNames(repo) {
    const methodNames = [
      'checkSecret',
      'createNote',
      'createUser',
      'getNote',
      'getUser',
      'removeNote',
      'searchNote',
      'setup'
    ];

    methodNames.forEach(key => {
      expect(repo[key], `${key} should be defined`).not.toBeUndefined();
      expect(typeof repo[key], `${key} should be impemented`).toBe('function');
    });
  }

  constructor() {
    this.content = [];
    this.users = [];
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
  async createNote(content, user) {
    debug('create note', content, user);
    this.content.push(content);
    return this.content.length - 1;
  }

  /**
   * Create a new user, returning the associated id.
   */
  async createUser(userName, secret) {
    debug('create user', userName, secret);
    this.users.push(userName);
    return this.users.length - 1;
  }

  /**
   * Retrieve a promise of note content.
   * Only the content field is valid.
   */
  async getNote(noteId, user) {
    debug('get note', noteId, user);
    const content = this.content[noteId];
    if (content !== undefined) {
      return {
        author: user,
        content: this.content[noteId],
        created: Math.round(new Date().getTime()/1000),
        id: noteId
      };
    } else {
      return undefined;
    }
  }

  /**
   * Retrieve a promise of the user id matching the user name.
   */
  async getUser(userName) {
    debug('get user', userName);
    return this.users.findIndex(x => x == userName);
  }

  /**
   * Delete note content, returning a promise of success.
   */
  async removeNote(noteId, user) {
    const result = this.content[noteId] !== undefined;
    debug('remove', noteId, user, result);
    this.content[noteId] = undefined;
    return result;
  }

  /**
   * Return a promise to an array of note ids.
   * For testing instance, just return the first.
   */
  async searchNote(searchTerms, user) {
    debug('search', searchTerms, user);
    const idx = this.content.findIndex(x =>
        x.toString().includes(searchTerms));
    if (idx < 0) {
      return [];
    } else {
      return [idx];
    }
  }

  async setup() {
    return "OK";
  }
}
