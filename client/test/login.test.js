const login = require('../views/login');

describe('Login component', () => {
  test('renders login component', () => {
    const app = {
      setUserNameAndPassword: () => undefined,
    };
    const elt = login(app);
    expect(elt.innerHTML.includes('User name:'), 'Contains username label')
      .toBe(true);
    expect(elt.innerHTML.includes('Password:'), 'Contains password label')
      .toBe(true);
  });

  test('OK button updates App', () => {
    let clicked = false;
    let password = '';
    let userName = '';

    const app = {
      setUserNameAndPassword: (u, p) => {
        clicked = true;
        password = p;
        userName = u;
      },
    };

    document.createElement('body');
    const elt = login(app);
    document.body.appendChild(elt);
    const button = Array.from(elt.childNodes)
      .find(e => e.textContent === 'OK');

    button.click();
    expect(clicked, 'No password or username entered').toBe(false);

    const userNameField = document.getElementById('userNameField');
    const passwordField = document.getElementById('passwordField');

    userNameField.value = 'Me';
    passwordField.value = 'secret';
    button.click();
    expect(clicked, 'We have username and password').toBe(true);
    expect(password).toEqual('secret');
    expect(userName).toEqual('Me');

    userNameField.value = 'MeToo';
    passwordField.onkeyup({ key: ' ' });
    expect(userName).toEqual('Me');
    expect(password).toEqual('secret');

    passwordField.onkeyup({ key: 'Enter' });
    expect(password).toEqual('secret');
    expect(userName).toEqual('MeToo');
  });
});
