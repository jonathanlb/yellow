const config = {
  db: 'sqlite',
  // db: 'postgres',
  postgres: {
    database: 'yellow',
    host: 'localhost',
    user: 'u0_a62',
  },
  sqlite: {
    file: 'data/notes.db', // relative to server root
  },
};

module.exports = {
  repo: () => {
    let Repo;
    switch (config.db.toLowerCase()) {
      case 'postgres':
        Repo = require('./pgNoteRepo'); // eslint-disable-line global-require
        return new Repo(config.postgres);
      case 'sqlite':
        Repo = require('./sqliteNoteRepo'); // eslint-disable-line global-require
        return new Repo(config.sqlite);
      default:
        throw new Error(`unknown db type ${config.db}`);
    }
  },

};
