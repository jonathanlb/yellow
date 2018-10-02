// const debug = require('debug')('cards');
const renderCard = require('./card');

module.exports = (cardsInfo) => {
  let lastY;
  const margin = 5; // pull from style
  function cmp(a, b) {
    return Math.sign(b.created - a.created);
  }

  // TODO: only create an element for newly loaded cards, to keep layout?
  const result = cardsInfo.sort(cmp).map(renderCard);

  // XXX how to know when rendered to update cards? for now, hardcode 100ms
  setTimeout(() => {
    result.forEach((card) => {
      // Don't try to set element.offsetXXX; stick with style.
      // Don't update card, it's usually no longer valid.
      const elt = document.getElementById(card.id);
      if (lastY === undefined) {
        elt.style.top = `${elt.offsetTop}px`;
        lastY = elt.offsetTop + elt.offsetHeight + margin;
      } else {
        elt.style.top = `${lastY}px`;
        lastY += elt.offsetHeight + margin;
      }
      elt.style.left = `${elt.offsetLeft}px`;
    });
  }, 100);
  return result;
};
