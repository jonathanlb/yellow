const yo = require('yo-yo');

module.exports = (app) => yo`
  <div>
    <h2>Error</h2>
    <p>${app.lastError}</p>
  </div>
`;
