const renderCard = require('../views/card');

describe('Card component', () => {
  test('renders', () => {
    const cardInfo = {
      author: 'Jonathan',
      content: 'Hello, world',
      created: 1,
      id: 29,
    };
    const elt = renderCard(cardInfo);

    expect(elt.innerHTML.includes(cardInfo.author),
      `no author: ${elt.innerHTML}`)
      .toBe(true);

    expect(elt.innerHTML.includes(cardInfo.content),
      `no content: ${elt.innerHTML}`)
      .toBe(true);

    expect(elt.innerHTML.includes((new Date(1000)).toLocaleDateString()),
      `no date: ${elt.innerHTML}`)
      .toBe(true);

    expect(elt.id).toEqual(`yellowCard-${cardInfo.id}`);
  });
});
