// Reset a user password.
// Example:
// DEBUG='*' node src/admin/resetUserPassword.js data/mydb.sqlite3 \
//   'Jonathan Bredin' 'secret stuff'

const bcrypt = require('bcrypt');
const debug = require('debug')('admin');
const sqlite3 = require('sqlite3-promise').verbose();

const dbFile = process.argv[2];
const userName = process.argv[3];
const newPassword = process.argv[4];

const saltRounds = 10;

const db = new sqlite3.Database(
  dbFile,
  sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE, // eslint-disable-line
  (err) => {
    if (err) {
      console.error(`cannot open db at ${dbFile}: ${err.message}`); // eslint-disable-line
      process.exit(1);
    }
    debug('open OK', err);
  },
);

bcrypt.hash(newPassword, saltRounds).
then((hash) => {
	const query = `UPDATE users SET secret='${hash}' ` +
  	`WHERE userName='${userName.replace(/'/g, '\'\'')}'`;
	debug('update', query);
	return db.allAsync(query);
}).then((result) => debug('OK', result));
