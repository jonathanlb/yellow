/* eslint indent: 0 */
const yo = require('yo-yo');

module.exports = (app) => {
  const passwordField = 'passwordField';
  const userNameField = 'userNameField';

  function setUserNameAndPassword() {
    const userName = document.getElementById(userNameField).value.trim();
    const password = document.getElementById(passwordField).value.trim();
    if (userName && password) {
      app.setUserNameAndPassword(userName, password);
    }
  }

  return yo`
    <div>
      <label for="${userNameField}" >User name:</label>
      <input type="text" id="${userNameField}" />
      <br/>
      <label for="${passwordField}" >Password:</label>
      <input type="password" id="${passwordField}"
        onkeyup=${(e) => {
          if (e.key === 'Enter') {
            setUserNameAndPassword();
          }
        }
      } />
      <br/>
      <button onclick=${setUserNameAndPassword} >OK</button>
    </div>
  `;
};
