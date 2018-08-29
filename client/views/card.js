/* eslint indent: 0 */
const yo = require('yo-yo');

const cardClass = 'cardContainer';

module.exports = (cardInfo) => {
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

  return yo`
    <div class="${cardClass}" id="yellowCard-${cardInfo.id}"
      onmousedown=${mouseDown}
      onmousemove=${mouseMove}
      onmouseup=${mouseUp} >
      <div class="cardHeader" >
        <span class="cardAuthor" >${cardInfo.author}</span>
        <span class="cardDate" >${timeStr}</span>
      </div>
      <div class="cardContent" >
        ${[yo`${cardInfo.content}`]}
      </div>
    </div>
  `;
};
