const yo = require('yo-yo');

module.exports = (app) => yo`
    <header>
      <h1>Yellow Notes</h1>
      <br/>
      <span class="navbarItem" onclick=${ () => app.render(4) } >Post</span>
      <span class="navbarItem" onclick=${ () => app.render(2) } >Search</span>
      <span class="navbarItem" onclick=${app.logout} >Logout</span>
    </header>
  `;
