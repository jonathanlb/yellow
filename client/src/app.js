const debug = require('debug')('app');
const errors = require('debug')('app:error');
const yo = require('yo-yo');

const renderCard = require('../views/card');
const renderFatalError = require('../views/fatalError');
const renderHeader = require('../views/header');
const renderLogin = require('../views/login');
const renderSearch = require('../views/search');

const loginView = 0;
const searchView = 2;
const errorView = 3;
const postView = 4;

module.exports = class App {
  constructor(opts) {
    this.cards = [];
    this.contentSelector = opts.contentSelector || 'main-app';
    this.lastError = undefined;
    this.secret = undefined;
    this.serverPrefix = opts.serverPrefix || 'localhost:3000/';
    this.userName = undefined;
    this.userId = -1;
    this.view = App.getDefaultView();

    ['doSearch', 'loadCard', 'logout', 'lookupUserId', 'render',
      'setUserNameAndPassword']
      .forEach((m) => { this[m] = this[m].bind(this); });
  }

  /**
   * Inspect the environment to determine which view to show on start.
   */
  static getDefaultView() {
    return loginView;
  }

  async doSearch(searchQuery) {
    const query = encodeURIComponent(searchQuery);
    const cmd = `${this.serverPrefix}note/search/${this.secret}/${this.userId}/${query}`;
    return fetch(cmd)
      .then((response) => {
        if (response.status === 200) {
          // map result ignored aside from unit test count....
          return response.json()
            .then(ids => ids.map(this.loadCard));
        }
        errors('doSearch', response);
        this.lastError = response.status;
        return this.render(errorView);
      })
      .catch((error) => {
        errors('Cannot perform search', searchQuery, error);
        this.lastError = error.message;
        return this.render(errorView);
      });
  }

  async loadCard(id) {
    debug('loadCard', id);
    const cmd = `${this.serverPrefix}note/get/${this.secret}/${this.userId}/${id}`;
    return fetch(cmd)
      .then(response => response.json())
      .then((cardInfo) => {
        debug('loadedCard', cardInfo);
        this.cards.push(cardInfo);
        return this.render(); // separate out?
      })
      .catch(error => errors('cannot load card', id, error));
  }

  async logout() {
    this.userId = -1;
    this.userName = undefined;
    this.secret = undefined;
    return this.render(loginView);
  }

  async lookupUserId() {
    const { userName, secret } = this;
    const cmd = `${this.serverPrefix}user/get/${secret}/-1/${userName}`;
    debug('lookupUserId', userName);
    return fetch(cmd)
      .then((response) => {
        if (response.status === 200) {
          return response.text()
            .then((idText) => {
              debug('lookupUserId', idText, userName);
              const userId = parseInt(idText, 10);
              if (Number.isFinite(userId)) {
                this.userId = userId;
                this.userName = userName;
                this.secret = secret;
                return this.render(searchView);
              }
              errors('lookupUserId parse error', response.body);
              return this.render(loginView);
            });
        }
        errors('Cannot look up user name', userName);
        return this.render(loginView);
      });
  }

  render(viewOpt) {
    const setContent = (content) => {
      const innerHTML = yo`
        <div id="${this.contentSelector}">
          ${renderHeader(this)}
          <main>
            ${content}
            ${this.cards.map(renderCard)}
          </main>
        </div>
      `;
      const element = document.getElementById(this.contentSelector);
      yo.update(element, innerHTML);
    };

    if (viewOpt !== undefined) {
      this.view = viewOpt;
    }

    debug('render view', this.view);
    switch (this.view) {
      case loginView:
        setContent(renderLogin(this));
        break;
      case searchView:
        setContent(renderSearch(this));
        break;
      default:
        setContent(renderFatalError(this));
    }
  }

  async setUserNameAndPassword(userName, password) {
    debug('setUserNameAndPassword', userName);

    if (userName && password) {
      this.userName = userName;
      this.secret = encodeURIComponent(password); // XXX avoid storing password
      return this.lookupUserId();
    }
    return this.render(App.getDefaultView());
  }

  async setup() {
    this.render();
  }
};
