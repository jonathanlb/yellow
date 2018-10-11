/* eslint indent: 0 */

const debug = require('debug')('header');
const yo = require('yo-yo');
const Views = require('./views');

let friendsVisible = false;
const friendsDivId = 'shareWithDiv';
const friendsDivTitle = 'Share with';

module.exports = (app) => {
  function hideFriends() {
    friendsVisible = false;
    const elt = document.getElementById(friendsDivId);
    yo.update(elt, yo`<div id="${friendsDivId}">${friendsDivTitle}</div>`);
  }

  async function showFriends() {
    function makeFriendLi(name) {
      return yo`<li>${name}</li>`;
    }

    debug('showing friends?', friendsVisible);
    if (!friendsVisible) {
      friendsVisible = true;
      return app.getFriends()
        .then((friendNames) => {
          debug('friend lookup', friendNames);
          const elt = document.getElementById(friendsDivId);
          yo.update(elt, yo`<div id="${friendsDivId}">${friendsDivTitle}<ul>${friendNames.map(makeFriendLi)}</ul></div>`);
        });
    }
  }

  if (app.userName) {
    const result = yo`
      <header>
        <h1>Yellow Notes</h1>
        <br/>
        <span class="navbarUserName" >${app.userName}:</span>
        <span class="navbarItem" onclick=${() => app.render(Views.post)} >Post</span>
        <span class="navbarItem" onclick=${() => app.render(Views.search)} >Search</span>
        <span class="navbarItem" onclick=${() => {
          app.discardNotes();
          app.render();
        }} >Unclutter</span>
        <span class="navbarItem"
          onclick=${showFriends}
          onmouseleave=${hideFriends} >
          <div id="${friendsDivId}">${friendsDivTitle}</div></span>
        <span class="navbarItem" onclick=${app.logout} >Logout</span>
      </header>
    `;
    // expose function bound to onmouseleave since Jest DOM doesn't simulate it.
    // Chrome does.
    result.simulateMouseLeave = hideFriends;
    return result;
  }
  return yo`<header><h1>Yellow Notes</h1></header>`;
};
