const debug = require('debug')('app');
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
  constructor(contentSelector) {
    this.contentSelector = contentSelector;
    this.secret = undefined;
    this.userName = undefined;
    this.view = App.getDefaultView();
  }

  /**
   * Inspect the environment to determine which view to show on start.
   */
  static getDefaultView() {
    return loginView;
  }

  render() {
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

  setUserNameAndPassword(userName, password) {
    debug('setUserNameAndPassword', userName);
    this.userName = userName;
    this.secret = password; // XXX avoid storing password
    if (userName && password) {
      this.view = searchView;
    } else {
    	this.view = App.getDefaultView();
    }
    this.render();
  }

  async setup() {
    this.render();
  }
};
