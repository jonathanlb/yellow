/* eslint indent: 0 */
const yo = require('yo-yo');

module.exports = (app) => {
  const searchField = 'searchField';

  function doSearch() {
    const query = document.getElementById(searchField).value.trim();
    app.doSearch(query);
  }

  return yo`
    <div>
      <label for="${searchField}">Search:</label>
      <input type="text" id="${searchField}"
        onkeyup=${e => (e.key === 'Enter') && doSearch()} />
      <button onclick=${doSearch} >OK</button>
    </div>
  `;
};
