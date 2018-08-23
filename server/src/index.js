const express = require('express');
const debug = require('debug')('index');
const Server = require('./server');
const Repo = require('./sqliteNoteRepo');

const repo = new Repo('./data/notes.db');
const router = express();
const server = new Server(router, repo);
const port = process.env.PORT || 3000;

server.setup()
  .then(() => router.listen(port, () => debug('listening on port', port)));
