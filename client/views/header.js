/* eslint indent: 0 */

const yo = require('yo-yo');
const App = require('../src/app');

module.exports = app => yo`
  <header>
    <h1>Yellow Notes</h1>
    <br/>
    <span class="navbarItem" onclick=${() => app.render(App.postView)} >Post</span>
    <span class="navbarItem" onclick=${() => app.render(App.searchView)} >Search</span>
    <span class="navbarItem" onclick=${app.logout} >Logout</span>
  </header>
`;
