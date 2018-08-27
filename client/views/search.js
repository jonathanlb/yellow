const yo = require('yo-yo');

module.exports = (app) => {
  const searchField = 'searchField';

  function doSearch() {
    const query = document.getElementById(searchField).value.trim();
    app.doSearch();
  }

  return yo`
    <div>
      <label for="searchField">Search:</label>
      <input type="text" id="${searchField}"
        onkeyup=${e => {
          if (e.key === 'Enter') {
            doSearch();
          }
        }
      } />
      <button onclick=${doSearch} >OK</button>
    </div>
  `;
};
