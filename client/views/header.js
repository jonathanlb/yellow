/* eslint indent: 0 */

const yo = require('yo-yo');
const Views = require('./views');

module.exports = (app) => {
  if (app.userName) {
    return yo`
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
        <span class="navbarItem" onclick=${app.logout} >Logout</span>
      </header>
    `;
  }
  return yo`<header><h1>Yellow Notes</h1></header>`;
};
