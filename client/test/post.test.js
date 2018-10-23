const post = require('../views/post');

describe('Post component', () => {
  test('renders', () => {
    const elt = post({});
    expect(elt.innerHTML.includes('Save')).toBe(true);
  });

  test('saves note', () => {
    const toSave = 'Test note for button';
    let savedContent;
    const app = {
      createNote: (content) => {
        savedContent = content;
        return Promise.resolve(undefined);
      },
    };

    document.body.innerHTML = '';
    document.createElement('body');
    const elt = post(app);
    document.body.appendChild(elt);

    const textArea = Array.from(elt.childNodes)
      .find(e => e.id === 'noteText');
    textArea.value = toSave;

    return Array.from(document.getElementsByTagName('button'))
      .find(e => e.textContent === 'Save')
      .onclick()
      .then(() => {
        expect(savedContent).toEqual(toSave);
        expect(textArea.value).toEqual('');
      });
  });

  // Test is broken when run with other tests....
  test('saves note with ctrl-enter', () => {
    const toSave = 'Test note for ctl-enter';
    let savedContent;
    const app = {
      createNote: (content) => {
        savedContent = content;
        return Promise.resolve(undefined);
      },
    };

    document.body.innerHTML = '';
    document.createElement('body');
    const elt = post(app);
    document.body.appendChild(elt);

    const textArea = Array.from(elt.childNodes)
      .find(e => e.id === 'noteText');
    textArea.value = toSave;

    textArea.onkeyup({ key: 'Enter' });
    expect(savedContent).toBeUndefined();

    return textArea.onkeyup({ key: 'Enter', ctrlKey: true })
      .then(() => expect(savedContent).toEqual(toSave));
  });
});
