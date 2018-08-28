const yo = require('yo-yo');

const cardClass = 'cardContainer';

module.exports = cardInfo => {
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
      const elt = e.path.find(elt => elt.className.includes(cardClass));
      elt.style.top = (elt.offsetTop - y1) + 'px';
      elt.style.left = (elt.offsetLeft - x1) + 'px';
    }
  }

  function mouseUp(e) {
    dragging = false;
  }

  return yo`
    <div class="${cardClass}" id="yellowCard-${cardInfo.id}"
      onmousedown=${mouseDown}
      onmousemove=${mouseMove}
      onmouseup=${mouseUp} >
      <div class="cardHeader" >
        <span class="cardAuthor" >${cardInfo.author}</span>
        <span class="cardDate" >${
          new Date(cardInfo.created*1000).toLocaleDateString()
        }</span>
      </div>
      <div class="cardContent" >
        ${[yo`${cardInfo.content}`]}
      </div>
    </div>
  `;
};
