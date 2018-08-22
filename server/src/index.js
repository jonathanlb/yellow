const express = require('express');
const debug = require('debug')('index');
const Server = require('./server');
const Repo = require('./sqliteRepo');

const repo = new Repo('./data/notes.db');
const router = express();
const server = new Server(router, repo);
server.setup();

const port = process.env.PORT || 3000;
router.listen(port, () => debug('listening on port', port));
