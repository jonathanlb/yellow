const yo = require('yo-yo');

module.exports = (cardInfo) => {
	return yo`
		<div class="cardContainer">
			<div class="cardHeader" >
				<span class="cardAuthor" >${ cardInfo.author }</span>
				<span class="cardDate" >${ cardInfo.date }</span>
			</div>
			<div class="cardContent" >
				${ [ yo`${ cardInfo.content }` ] }
			</div>
		</div>
  `;
};

