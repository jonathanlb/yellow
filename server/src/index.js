const express = require('express');
const debug = require('debug')('index');
const config = require('./config');
const Server = require('./server');

const repo = config.repo();
const router = express();
const server = new Server(router, repo);
const port = process.env.PORT || 3000;

server.setup()
  .then(() => router.listen(port, () => debug('listening on port', port)));
