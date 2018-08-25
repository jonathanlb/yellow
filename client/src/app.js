const debug = require('debug')('app');
const errors = require('debug')('app:error');
const yo = require('yo-yo');

const renderFatalError = require('../views/fatalError');
const renderHeader = require('../views/header');
const renderLogin = require('../views/login');
const renderResults = require('../views/results');
const renderSearch = require('../views/search');

const loginView = 0;
const cardsView = 1;
const searchView = 2;

module.exports = class App {
  constructor(opts) {
    this.contentSelector = opts.contentSelector || 'main-app';
    this.secret = undefined;
    this.serverPrefix = opts.serverPrefix || 'localhost:3000/';
    this.userName = undefined;
    this.userId = -1;
    this.view = App.getDefaultView();
  }

  /**
   * Inspect the environment to determine which view to show on start.
   */
  static getDefaultView() {
    return loginView;
  }

  async lookupUserId() {
    const userName = this.userName;
    const secret = this.secret;
    const cmd = `${this.serverPrefix}user/get/${secret}/-1/${userName}`;
    debug('lookupUserId', cmd);
    return fetch(cmd)
      .then((response) => {
        if (response.status === 200) {
          debug('lookupUserId', response.body, userName);
          const userId = parseInt(response.body);
          if (Number.isFinite(userId)) {
            this.userId = userId;
            this.userName = userName;
            this.secret = secret;
            return this.render(searchView);
          }
          errors('lookupUserId parse error', response.body);
          return this.render(loginView);
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
          </main>
        </div>
      `;
      const element = document.querySelector(`#${this.contentSelector}`);
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
      case cardsView:
        setContent(renderResults(this));
        break;
      case searchView:
        setContent(renderSearch(this));
        break;
      default:
        setContent(renderFatalError(this));
    }
  }

  searchResults() {
    return [];
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
