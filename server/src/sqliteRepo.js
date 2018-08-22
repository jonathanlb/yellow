const debug = require('debug')('sqliteRepo');
const errors = require('debug')('sqliteRepo:error');
const sqlite3 = require('sqlite3').verbose();


/**
 * Note repository upon SqLite3
 */
module.exports = class SqliteRepo {
  constructor(dbFile) {
		this.dbFile = dbFile;
		const fileOrMemory = dbFile || ':memory:';
		this.db = new sqlite3.Database(
			fileOrMemory,
			sqlite3.OPEN_CREATE,
			(err) => {
				if (err) {
					errors(err.message);
				} else {
					debug('Connected to the in-memory SQlite database:', fileOrMemory);
				}
			});
	}

  /**
   * Check the secret against the user id.
   */
  async checkSecret(secret, user) {
    return true;
  }

	close() {
		this.db.close();
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
    return this.content.filter(x => 
        x.toString().includes(searchTerms));
  }
}
