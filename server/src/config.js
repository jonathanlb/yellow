const config = {
  auth: 'simple-auth',
  db: 'sqlite',
  // db: 'postgres',
  postgres: {
    database: 'yellow',
    host: 'localhost',
    user: 'u0_a62',
  },
  simpleAuth: {
    dbFileName: 'data/users.db',
    privateKeyFileName: 'data/jwtRS256.key',
    publicKeyFileName: 'data/jwtRS256.key.pub',
  },
  sqlite: {
    file: 'data/notes.db', // relative to server root
  },
};

module.exports = {
  auth: () => {
    let Auth;
    switch (config.auth.toLowerCase().replace(/[-_ ]/g, '')) {
      case 'simpleauth':
        // eslint-disable-next-line global-require
        Auth = require('simple-auth');
        return new Auth(config.simpleAuth);
      default:
        throw new Error(`unknown auth type ${config.auth}`);
    }
  },

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
