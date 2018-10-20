/* eslint indent: 0 */
const marked = require('marked');
const yo = require('yo-yo');

const cardClass = 'cardContainer';
const RENDER_MD = 1;

module.exports = (cardInfo) => {
  const cardId = `yellowCard-${cardInfo.id}`;
  let dragging = false;
  let x0 = 0;
  let x1 = 0;
  let y0 = 0;
  let y1 = 0;

  function mouseDown(e) {
    e.preventDefault();
    dragging = true;
    x0 = e.clientX;
    y0 = e.clientY;
  }

  function mouseMove(e) {
    if (dragging) {
      e.preventDefault();
      x1 = x0 - e.clientX;
      y1 = y0 - e.clientY;
      x0 = e.clientX;
      y0 = e.clientY;
      const element = e.path.find(elt => elt.className.includes(cardClass));
      element.style.top = `${element.offsetTop - y1}px`;
      element.style.left = `${element.offsetLeft - x1}px`;
    }
  }

  function mouseUp() {
    dragging = false;
  }

  const timeStr = new Date(cardInfo.created * 1000)
    .toLocaleDateString();

  const closeCard = () => {
    if (cardInfo.close) {
      cardInfo.close();
    }
    const elt = document.getElementById(cardId);
    if (elt) {
      elt.remove();
    }
  };

  const contentId = `${cardId}-content`;
  const result = yo`
    <div class="${cardClass}" id="${cardId}"
      onmousedown=${mouseDown}
      onmousemove=${mouseMove}
      onmouseup=${mouseUp} >
      <div class="cardHeader" >
        <span class="cardAuthor" >${cardInfo.author}</span>
        <span class="cardDate" >${timeStr} <a onclick=${closeCard}>X</a></span>
      </div>
      <div class="cardContent" id="${contentId}" ></div>
    </div>
  `;

  const contentElt = Array.from(result.children)
    .find(x => x.id === contentId);
  if (cardInfo.renderHint === RENDER_MD) {
    // XXX marked sets markdown element ids. Should we worry about collisions?
    contentElt.innerHTML = `<div class="cardContent" id="${contentId}" >
      ${marked(cardInfo.content, { sanitize: true })}
      </div>`;
  } else {
    // rely on yo-yo to sanitize content
    contentElt.innerHTML = `<div class="cardContent" id="${contentId}" >
      <pre>${[yo`${cardInfo.content}`]}</pre>
      </div>`;
  }
  return result;
};
