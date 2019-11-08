const express = require('express');
const debug = require('debug')('index');
const config = require('./config');
const Server = require('./server');

const authPromise = config.auth();
const repo = config.repo();
const router = express();
const port = process.env.PORT || 3000;

// enable CORS by default....
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-type,Accept,X-Access-Token,X-Key');
  res.header('Access-Control-Expose-Headers', 'content-type,x-access-token');
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

authPromise.then(auth => new Server(router, repo, auth))
  .then(server => server.setup())
  .then(() => router.listen(port, () => debug('listening on port', port)));
