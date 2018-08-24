const yo = require('yo-yo');

module.exports = app => yo`
    <div>
      <label for="searchField">Search:</label>
      <input type="text" id="searchField" />
      <button>OK</button>
    </div>
  `;
