const slidingSwitch = require('../views/slidingSwitch');

describe('Sliding Switch component', () => {
  test('renders', () => {
    const ss = slidingSwitch({});
    expect(ss).not.toBeUndefined();
  });

  test('ignores onchange omission', () => {
    document.body.innerHTML = '';
    document.createElement('body');

    const switchId = 'switchId';
    const ss = slidingSwitch({ switchId });
    document.body.appendChild(ss);

    const checkBox = document.getElementById(switchId);
    checkBox.onchange(true);
  });

  test('triggers onchange events', () => {
    document.body.innerHTML = '';
    document.createElement('body');

    const switchId = 'switchId';
    let received; let
      clicked = false;
    const f = (v) => {
      received = v;
      clicked = true;
    };
    const ss = slidingSwitch({ f, switchId });
    document.body.appendChild(ss);

    const checkBox = document.getElementById(switchId);
    checkBox.click();
    expect(clicked).toBe(true);
    expect(received).toBe(true);
  });
});
