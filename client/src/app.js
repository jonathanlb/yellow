const debug = require('debug')('app');
const errors = require('debug')('app:error');
const yo = require('yo-yo');

const renderCards = require('../views/cards');
const renderFatalError = require('../views/fatalError');
const renderHeader = require('../views/header');
const renderLogin = require('../views/login');
const renderPost = require('../views/post');
const renderSearch = require('../views/search');
const Views = require('../views/views');

const defaultQuery = '%';
const defaultServerPort = 3000;

module.exports = class App {
  constructor(opts) {
    this.discardNotes();
    this.contentSelector = opts.contentSelector || 'main-app';
    this.lastError = undefined;
    this.serverPrefix = App.getServerPrefix(opts);
    this.userId = -1;
    this.userName = undefined;
    this.view = App.getDefaultView();

    ['createNote', 'doSearch', 'loadCard', 'logout', 'lookupBootstrapUserId',
      'render', 'setUserNameAndPassword']
      .forEach((m) => { this[m] = this[m].bind(this); });

    this.doPostLoginAction = () => {
      this.render(Views.view);
      return this.doSearch(defaultQuery);
    };
  }

  /**
   * Inspect the environment to determine which view to show on start.
   */
  static getDefaultView() {
    return Views.login;
  }

  static getServerPrefix(opts) {
    if (opts.serverPrefix) {
      debug('using server prefix', opts.serverPrefix);
      return opts.serverPrefix;
    }
    const result = `${window.location.protocol}//${window.location.hostname}:${defaultServerPort}/`;
    debug('inferring server at', result);
    return result;
  }

  async createNote(content, opts) {
    const escapedContent = encodeURIComponent(content);
    const optStr = opts ? `/${encodeURIComponent(JSON.stringify(opts))}` : '';
    const cmd = `${this.serverPrefix}note/create/${this.userId}/${escapedContent}${optStr}`;
    return fetch(cmd, this.fetchOpts)
      .then((response) => {
        if (response.status === 200) {
          return response.text()
            .then(id => this.loadCard(parseInt(id, 10)))
            .then(() => this.render(Views.view));
        }
        this.lastError = `Cannot create note: ${response.status}`;
        return this.render(Views.error);
      });
  }

  /**
   * Drop references to cards, without rendering.
   */
  discardNotes() {
    this.cards = {};
  }

  async doSearch(searchQuery) {
    const query = encodeURIComponent(searchQuery);
    const cmd = `${this.serverPrefix}note/search/${this.userId}/${query}`;
    return fetch(cmd, this.fetchOpts)
      .then((response) => {
        if (response.status === 200) {
          return response.json()
            .then(ids => ids.map(this.loadCard))
            .then(cards => Promise.all(cards)) // render once. revisit if search is slow
            .then(() => this.render());
        }
        errors('doSearch', response);
        this.lastError = `Cannot search: ${response.status}`;
        return this.render(Views.error);
      })
      .catch((error) => {
        errors('Cannot perform search', searchQuery, error);
        this.lastError = error.message;
        return this.render(Views.error);
      });
  }

  async getFriends() {
    const cmd = `${this.serverPrefix}user/sharesWith/${this.userId}`;
    debug('getFriends');
    return fetch(cmd, this.fetchOpts)
      .then(response => response.json());
  }

  async loadCard(id) {
    debug('loadCard', id);
    const cmd = `${this.serverPrefix}note/get/${this.userId}/${id}`;
    return fetch(cmd, this.fetchOpts)
      .then(response => response.json())
      .then((cardInfo) => {
        debug('loadedCard', cardInfo);
        this.cards[cardInfo.id] = cardInfo;
        // eslint-disable-next-line no-param-reassign
        cardInfo.close = () => this.unloadCard(cardInfo.id);
        return cardInfo;
      })
      .catch(error => errors('cannot load card', id, error));
  }

  async logout() {
    this.userId = -1;
    this.userName = undefined;
    this.fetchOpts.headers = {};
    this.discardNotes();
    return this.render(Views.login);
  }

  async lookupBootstrapUserId() {
    const { userName } = this;
    const cmd = `${this.serverPrefix}user/get/-1/${userName}`;
    debug('lookupBootstrapUserId', userName);
    return fetch(cmd, this.fetchOpts)
      .then((response) => {
        if (response.status === 200) {
          return response.text()
            .then((idText) => {
              debug('lookupBootstrapUserId', idText, userName);
              const userId = parseInt(idText, 10);
              if (Number.isFinite(userId)) {
                this.userId = userId;
                this.userName = userName;
                return this.doPostLoginAction();
              }
              errors('lookupBootstrapUserId parse error', response.body);
              return this.render(Views.login);
            });
        }
        errors('Cannot look up user name', userName);
        return this.render(Views.login);
      });
  }

  async removeFriend(friendName) {
    const cmd = `${this.serverPrefix}user/blocks/${this.userId}/${friendName}`;
    debug('unfriend', friendName);
    return fetch(cmd, this.fetchOpts);
  }

  render(viewOpt) {
    const setContent = (content) => {
      const innerHTML = yo`
        <div id="${this.contentSelector}">
          ${renderHeader(this)}
          <main>
            ${content}
            ${renderCards(Object.values(this.cards))}
          </main>
        </div>
      `;
      const element = document.getElementById(this.contentSelector);
      yo.update(element, innerHTML);
    };

    debug('render view', viewOpt, this.view);
    if (viewOpt !== undefined) {
      this.view = viewOpt;
    }

    switch (this.view) {
      case Views.login:
        setContent(renderLogin(this));
        break;
      case Views.view:
        setContent('');
        break;
      case Views.search:
        setContent(renderSearch(this));
        break;
      case Views.post:
        setContent(renderPost(this));
        break;
      default:
        setContent(renderFatalError(this));
    }
  }

  async setUserNameAndPassword(userName, password) {
    debug('setUserNameAndPassword', userName);

    if (userName && password) {
      this.userName = userName;
      this.fetchOpts.headers['x-access-token'] = encodeURIComponent(password); // XXX avoid storing password
      return this.lookupBootstrapUserId();
    }
    return this.render(App.getDefaultView());
  }

  async setup() {
    this.fetchOpts = {
      cache: 'no-cache',
      headers: {},
    };
    this.render();
  }

  async shareWith(friendName) {
    const cmd = `${this.serverPrefix}user/shares/${this.userId}/${friendName}`;
    debug('shareWith', friendName);
    return fetch(cmd, this.fetchOpts);
  }

  unloadCard(cardId) {
    delete this.cards[cardId];
  }
};
