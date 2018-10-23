/* eslint indent: 0 */
const yo = require('yo-yo');
const slidingSwitch = require('./slidingSwitch');

module.exports = (app) => {
  const textAreaField = 'noteText';
  const switchId = 'mdSwitch';

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
      <div class="postControls">
        ${slidingSwitch({ label: 'Save as Markdown:', switchId })}
        <button onclick=${createNote} >Save</button>
      </div>
  </div>
  `;
};
