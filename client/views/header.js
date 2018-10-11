/* eslint indent: 0 */

const debug = require('debug')('header');
const yo = require('yo-yo');
const Views = require('./views');

let friendsVisible = false;
const friendsDivId = 'shareWithDiv';
const friendsDivTitle = 'Share with';

module.exports = (app) => {
  // TODO: split out friend menu into another file
  function hideFriends() {
    friendsVisible = false;
    const elt = document.getElementById(friendsDivId);
    yo.update(elt, yo`<div id="${friendsDivId}">${friendsDivTitle}</div>`);
  }

  async function showFriends() {
    const addFriendFieldId = 'addFriendField';
    async function addFriend() {
      const name = document.getElementById(addFriendFieldId).value.trim();
      return app.shareWith(name)
        .then(() => {
          document.getElementById(addFriendFieldId).value = '';
          return app.getFriends();
        })
        .then(redrawFriends); // eslint-disable-line no-use-before-define
    }

    async function removeFriend(name) {
      debug('removeFriend', name);
      return app.removeFriend(name)
        .then(() => app.getFriends())
        .then(redrawFriends); // eslint-disable-line no-use-before-define
    }

    function makeFriendLi(name) {
      return yo`<li><a onclick=${() => removeFriend(name)}>X</a> ${name}</li>`;
    }

    async function redrawFriends(friendNames) {
      debug('redrawFriends', friendsVisible, friendNames);
      if (friendsVisible) {
        const elt = document.getElementById(friendsDivId);
        yo.update(elt, yo`<div id="${friendsDivId}">${friendsDivTitle}
          <ul>${(friendNames || []).map(makeFriendLi)}</ul>
          <label for="${addFriendFieldId}">Add:</label>
          <input type="text" id="${addFriendFieldId}"
            onkeyup=${e => (e.key === 'Enter') && addFriend()} />
          <button onclick=${addFriend} >OK</button>
          </div>`);
      }
    }

    debug('showing friends?', friendsVisible);
    if (!friendsVisible) {
      friendsVisible = true;
      return app.getFriends()
        .then(redrawFriends);
    }
    return Promise.resolve();
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
