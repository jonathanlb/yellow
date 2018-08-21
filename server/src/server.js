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
  setup() {
    this.router.use(express.static('public'));
    this.setupCreate();
    this.setupDelete();
    this.setupGet();
    this.setupIndex();
    this.setupSearch();
  }

  setupCreate() {
    this.router.get(
      '/create/:secret/:user/:content',
      (req, res) => this.checkSecret(req.params.secret, req.params.user, res, () => {
        const content = Server.parseRequest(req.params, req.params.content);
        return this.repo.create(content, req.params.user)
          .then((id) => {
            debug('created', id);
            res.status(200).send(id.toString());
          });
      }),
    );
  }

  setupDelete() {
    this.router.get(
      '/delete/:secret/:user/:noteId',
      (req, res) => this.checkSecret(req.params.secret, req.params.user, res, () => {
        debug('delete', req.params.noteId);
        return this.repo.remove(req.params.noteId, req.params.user)
          .then((result) => {
            debug('deleted', result);
            res.status(200).send(result.toString());
          });
      }),
    );
  }

  setupGet() {
    this.router.get(
      '/get/:secret/:user/:noteId',
      (req, res) => this.checkSecret(req.params.secret, req.params.user, res, () => {
        const id = req.params.noteId;
        return this.repo.get(id, req.params.user)
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

  setupIndex() {
    this.router.get('/', (req, res, next) => {
      debug('get index');
      res.status(200).send('Hello');
      return Promise.resolve(next);
    });
  }

  setupSearch() {
    this.router.get(
      '/search/:secret/:user/:searchTerm',
      (req, res) => this.checkSecret(req.params.secret, req.params.user, res, () => {
        const searchTerm = Server.parseRequest(req.params, req.params.searchTerm);
        return this.repo.search(searchTerm, req.params.user)
          .then((results) => {
            debug('found', searchTerm, results);
            res.status(200).send(JSON.stringify(results));
          });
      }),
    );
  }
};
