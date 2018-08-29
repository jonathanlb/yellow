const debug = require('debug')('cards');
const renderCard = require('./card');

module.exports = (cardsInfo) => {
  let lastY;
  const margin = 5; // pull from style

  // TODO: only create an element for newly loaded cards, to keep layout?
  const result = cardsInfo.map(renderCard);

  // XXX how to know when rendered to update cards? for now, hardcode 100ms
  setTimeout(() => {
    result.forEach((card) => {
      // Don't try to set element.offsetXXX; stick with style.
      if (lastY === undefined) {
        card.style.top = `${card.offsetTop}px`;
        lastY = card.offsetTop + card.offsetHeight + margin;
      } else {
        card.style.top = `${lastY}px`;
        lastY += card.offsetHeight + margin;
      }
      card.style.left = `${card.offsetLeft}px`;
      debug('delayed', lastY, card.offsetHeight, card.offsetTop, card);
    });
  }, 100);
  return result;
};
