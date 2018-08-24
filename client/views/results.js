const yo = require('yo-yo');

module.exports = app => yo`
    <div>
      Results....
      ${
  app.searchResults()
    .map(card => yo`<div>${card.render()}</div>`)
}
    </div>`;
