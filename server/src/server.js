const debug = require('debug')('server');
// const errors = require('debug')('server:error');
const express = require('express');

module.exports = class Server {
  constructor(router, repo) {
    this.router = router;
    this.repo = repo;
  }

  checkSecret(secret, user, res, f) {
    return this.repo.checkSecret(secret, user)
      .then((ok) => {
        if (!ok) {
          res.status(404).send('Not found');
        } else {
          f();
        }
      });
  }

  static parseRequest(params, entry) {
    return decodeURIComponent(entry);
  }

  /**
   * Wire the routes.
   */
  async setup() {
    this.router.use(express.static('public'));
    this.setupIndex();
    this.setupNoteCreate();
    this.setupNoteDelete();
    this.setupNoteGet();
    this.setupNoteSearch();
    this.setupUserCreate();
    this.setupUserGet();

    return this.repo.setup()
      .then(() => this);
  }

  setupIndex() {
    this.router.get('/', (req, res, next) => {
      debug('get index');
      res.status(200).send('Hello');
      return Promise.resolve(next);
    });
  }

  setupNoteCreate() {
    this.router.get(
      '/note/create/:secret/:user/:content',
      (req, res) => this.checkSecret(req.params.secret, req.params.user, res, () => {
        const content = Server.parseRequest(req.params, req.params.content);
        return this.repo.createNote(content, req.params.user)
          .then((id) => {
            debug('created', id);
            res.status(200).send(id.toString());
          });
      }),
    );
  }

  setupNoteDelete() {
    this.router.get(
      '/note/delete/:secret/:user/:noteId',
      (req, res) => this.checkSecret(req.params.secret, req.params.user, res, () => {
        debug('delete', req.params.noteId);
        return this.repo.removeNote(req.params.noteId, req.params.user)
          .then((result) => {
            debug('deleted', result);
            res.status(200).send(result.toString());
          });
      }),
    );
  }

  setupNoteGet() {
    this.router.get(
      '/note/get/:secret/:user/:noteId',
      (req, res) => this.checkSecret(req.params.secret, req.params.user, res, () => {
        const id = req.params.noteId;
        return this.repo.getNote(id, req.params.user)
          .then((content) => {
            debug('retrieved', id, content);
            if (content) {
              res.status(200).send(content);
            } else {
              res.status(404).send(`Not found: ${id}`);
            }
          });
      }),
    );
  }

  setupNoteSearch() {
    this.router.get(
      '/note/search/:secret/:user/:searchTerm',
      (req, res) => this.checkSecret(req.params.secret, req.params.user, res, () => {
        const searchTerm = Server.parseRequest(req.params, req.params.searchTerm);
        return this.repo.searchNote(searchTerm, req.params.user)
          .then((results) => {
            debug('found', searchTerm, results);
            res.status(200).send(JSON.stringify(results));
          });
      }),
    );
  }

  setupUserCreate() {
    this.router.get(
      '/user/create/:secret/:userName',
      (req, res) => {
        const userName = Server.parseRequest(req.params, req.params.userName);
        debug('user create', userName);
        return this.repo.createUser(userName, req.params.secret)
          .then((id) => {
            debug('user created', id);
            res.status(200).send(id.toString());
          });
      },
    );
  }

  setupUserGet() {
    this.router.get(
      '/user/get/:secret/:user/:userName',
      (req, res) => this.checkSecret(req.params.secret, req.params.user, res, () => {
        const userName = Server.parseRequest(req.params, req.params.userName);
        debug('user get', req.params.user, userName);
        return this.repo.getUser(userName)
          .then((id) => {
            debug('retrieved user', id);
            if (id >= 0) {
              res.status(200).send(id.toString());
            } else {
              res.status(404).send(`Not found: ${userName}`);
            }
          });
      }),
    );
  }
};
