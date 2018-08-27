const yo = require('yo-yo');

module.exports = cardInfo => yo`
    <div class="cardContainer" id="yellowCard-${cardInfo.id}">
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
