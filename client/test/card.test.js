/**
 * @jest-environment jsdom
 */

const renderCard = require('../views/card');

describe('Card component', () => {
  function createCard() {
    return {
      author: 'Jonathan',
      content: 'Hello, world',
      created: 1,
      id: 29,
    };
  }

  test('renders', () => {
    const cardInfo = createCard();
    const elt = renderCard(cardInfo);

    expect(elt.innerHTML.includes(cardInfo.author),
      `no author: ${elt.innerHTML}`)
      .toBe(true);

    expect(elt.innerHTML.includes(cardInfo.content),
      `no content: ${elt.innerHTML}`)
      .toBe(true);

    expect(elt.innerHTML.includes('<pre>') && elt.innerHTML.includes('</pre>'),
      `expecting preformated content: ${elt.innerHTML}`)
      .toBe(true);

    expect(elt.innerHTML.includes((new Date(1000)).toLocaleDateString()),
      `no date: ${elt.innerHTML}`)
      .toBe(true);

    expect(elt.id).toEqual(`yellowCard-${cardInfo.id}`);
  });

  test('renders markdown', () => {
    const cardInfo = createCard();
    cardInfo.content = '# Title\n- first\n- second';
    cardInfo.renderHint = 1;
    const elt = renderCard(cardInfo);

    expect(elt.innerHTML.includes('<h1>Title</h1>'),
      `no markdown: ${elt.innerHTML}`)
      .toBe(true);
  });

  test('drags', () => {
    const cardInfo = createCard();
    const elt = renderCard(cardInfo);

    const e = (x, y) => ({
      clientX: x,
      clientY: y,
      path: [{ className: 'cardHeader' }, elt],
      preventDefault: () => undefined,
    });

    const checkPosition = (x, y) => {
      expect(`${elt.style.left} ${elt.style.top}`)
        .toEqual(`${x}px ${y}px`);
    };

    // checkPosition(0, 0); // style doesn't init
    elt.style.top = '0px';
    elt.style.left = '0px';
    elt.offsetTop = 5;
    elt.offsetLeft = 2;

    elt.onmousemove(e(10, 10));
    checkPosition(0, 0);
    elt.onmousedown(e(5, 2));
    checkPosition(0, 0);
    elt.onmousemove(e(15, 12));
    checkPosition(10, 10);
    // test environment doesn't update offsetTop or offsetLeft....
    elt.onmouseup(e(13, 10));
    checkPosition(10, 10);
    elt.onmousemove(e(13, 11));
    checkPosition(10, 10);
  });
});
