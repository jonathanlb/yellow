/* eslint indent: 0 */
const yo = require('yo-yo');

const cardClass = 'cardContainer';

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

  return yo`
    <div class="${cardClass}" id="${cardId}" >
      <div class="cardHeader"
        onmousedown=${mouseDown}
        onmousemove=${mouseMove}
        onmouseup=${mouseUp} >
        <span class="cardAuthor" >${cardInfo.author}</span>
        <span class="cardDate" >${timeStr} <a onclick=${closeCard}>X</a></span>
      </div>
      <div class="cardContent" >
        <pre>${[yo`${cardInfo.content}`]}</pre>
      </div>
    </div>
  `;
};
