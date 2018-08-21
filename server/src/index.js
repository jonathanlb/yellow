const express = require('express');
const debug = require('debug')('index');
const Server = require('./server');

const router = express();
const server = new Server(router, undefined);
server.setup();

const port = process.env.PORT || 3000;
router.listen(port, () => debug('listening on port', port));
