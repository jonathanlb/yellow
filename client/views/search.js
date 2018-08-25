const yo = require('yo-yo');

module.exports = (app) => {
  function doSearch() {
    console.log('Search', app);
  }

  return yo`
    <div>
      <label for="searchField">Search:</label>
      <input type="text" id="searchField" 
        onkeyup=${(e) => {
          if (e.key === 'Enter') {
            doSearch();
          }
        }
      } />
      <button onclick=${doSearch} >OK</button>
    </div>
  `;
};
