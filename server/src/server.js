const debug = require('debug')('server');
const errors = require('debug')('server:error');
const express = require('express');

module.exports = class Server {
  constructor(router, repo) {
    this.router = router;
    this.repo = repo;

    ['checkSecret', 'checkUserLookupSecret']
      .forEach((m) => { this[m] = this[m].bind(this); });
  }

  /**
   * Run the callback if the user id and secret match or return 403
   * on the response.
   *
   * @param params the incoming URL request parameters, including secret
   * and user fields.
   * @param res the HTTP response used to send unauthorized response.
   * @param f the callback for successful authorization.
   */
  checkSecret(params, res, f) {
    const secret = Server.parseRequest(params, params.secret);
    const userId = Server.parseRequest(params, params.user);
    Server.setCors(res);
    return this.repo.checkSecret(secret, userId)
      .then((ok) => {
        if (!ok) {
          res.status(403).send('Unauthorized');
        } else {
          f();
        }
      });
  }

  /**
   * Run the callback if the user name matches and secret and the associated
   * user id or return 403 on the response.
   *
   * @param params the incoming URL request parameters, including secret
   * and userName fields.
   * @param res the HTTP response used to send unauthorized response.
   * @param f the callback for successful authorization.
   */
  checkUserLookupSecret(params, res, f) {
    const secret = Server.parseRequest(params, params.secret);
    const userName = Server.parseRequest(params, params.userName);
    let userId = -1;
    debug('checkUserLookupSecret', userName);
    Server.setCors(res);

    return this.repo.getUserId(userName)
      .then((id) => {
        userId = id;
        debug('checkUserLookupSecret', userId, userName);
        return this.repo.checkSecret(secret, userId);
      })
      .then((ok) => {
        if (!ok) {
          debug('checkUserLookupSecret failed', userName, userId);
          res.status(403).send('Unauthorized');
        } else {
          f();
        }
      })
      .catch((error) => {
        errors('checkUserLookupSecret error', error);
        res.status(401).send('Authentication error');
      });
  }

  static parseRequest(params, entry) {
    // do we need this method?  express already decodes request parameters.
    debug('parseRequest', entry);
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
    this.setupUserIdGet();

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
      (req, res) => this.checkSecret(req.params, res, () => {
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
      (req, res) => this.checkSecret(req.params, res, () => {
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
      (req, res) => this.checkSecret(req.params, res, () => {
        const id = req.params.noteId;
        return this.repo.getNote(id, req.params.user)
          .then((content) => {
            debug('retrieved', id, content);
            if (content) {
              // replace content.author with a user name.
              return this.repo.getUserName(content.author)
                .then((userName) => {
                  content.author = userName;
                  res.status(200).send(content);
                });
            }
            return res.status(404).send(`Not found: ${id}`);
          });
      }),
    );
  }

  setupNoteSearch() {
    this.router.get(
      '/note/search/:secret/:user/:searchTerm',
      (req, res) => this.checkSecret(
        req.params,
        res,
        () => this.repo.searchNote(req.params.searchTerm, req.params.user)
          .then((results) => {
            debug('found', req.params.searchTerm, results);
            res.status(200).send(JSON.stringify(results));
          }).catch((error) => {
            errors('noteSearch', error);
            res.status(500).send(error.message);
          }),
      ),
    );
  }

  /**
   * Install the logic to create a user.
   * TODO: handle redundant requests, permissions to create.
   */
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

  /**
   * Install logic to look up user ids by name.
   * Bootstrap mode: specify user name and associated password/secret and
   *  userId -1 to get the user id.
   * Normal mode: password/secret and userid must match to return user id for
   *  included user name.
   */
  setupUserIdGet() {
    this.router.get(
      '/user/get/:secret/:user/:userName',
      (req, res) => {
        const userName = Server.parseRequest(req.params, req.params.userName);
        const userId = parseInt(req.params.user, 10);

        const authf = userId > 0
          ? this.checkSecret
          : this.checkUserLookupSecret;

        authf(req.params, res, () => {
          debug('user get', req.params.user, userName);
          return this.repo.getUserId(userName)
            .then((id) => {
              debug('retrieved user', id);
              if (id >= 0) {
                res.status(200).send(id.toString());
              } else {
                res.status(404).send(`Not found: ${userName}`);
              }
            });
        });
      },
    );
  }

  /**
   * Allow cross-origin requests for development use.
   * TODO: install switch on production/development; lock down to localhost.
   *
   * @param res The Express response in wiring.
   */
  static setCors(res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  }
};
