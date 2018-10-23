/**
 * Switch example based upon Glenn Flanagan's codepen example
 * https://codepen.io/glennflanagan82/pen/dYzZGj
 *
 * Usage: Use the exported function to produce a switch element.  The function
 * expects an object parameter with the following optional fields.
 *
 * containerClass: css class used for the div containing the inner sliding switch.
 * f: (boolean) => void action to be taken when the switch is flipped.
 * label: text left of the switch used for a label.
 * switchClass: css class used for the div containing this widget.
 * switchId: the document element id used for the checkbox with the switch value.
 * toggleClass: the css class used for the moveable toggle div.
 */
/* eslint indent: 0 */
const yo = require('yo-yo');

module.exports = (opts) => {
  function switchUpdate(e) {
    const elt = e.srcElement;
    if (elt && opts.f) {
      opts.f(elt.checked);
    }
  }

  const switchId = opts.switchId || 'switchDiv';
  return yo`
    <div class="${opts.switchClass || 'slidingSwitch'}">
      <label for="${switchId}">${opts.label || '{{opt.label}}'}
      <input id="${switchId}" type="checkbox" onchange=${switchUpdate} />
      <div class="${opts.containerClass || 'slidingSwitchContainer'}">
        <div class="${opts.toggleClass || 'slidingSwitchToggle'}" >
        </div>
      </div>
      </label>
    </div>`;
};
