/* eslint indent: 0 */
const yo = require('yo-yo');

module.exports = (app) => {
  const textAreaField = 'noteText';

  function createNote() {
    const elt = document.getElementById(textAreaField);
    const content = elt.value.trim();
    return app.createNote(content)
      .then(() => { elt.value = ''; });
  }

  return yo`
    <div>
      <h3>New Note:</h3>
      <textarea id="${textAreaField}"
        rows="6" cols="50"
        onkeyup=${e => (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) && createNote()} >
      </textarea>
      <br/>
      <button onclick=${createNote} >Save</button>
  </div>
  `;
};
