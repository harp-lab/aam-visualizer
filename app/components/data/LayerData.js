/**
 * LayerData object.
 * Manages selected card id.
 * @param {Array} cardIds card ids to be stored
 * @param {String} type card type
 */
class LayerData {
  constructor(cardIds, type) {
    this.cardIds = cardIds;
    this.cardType = type;
    this.selected = undefined;
  }
  select(cardId) { this.selected = cardId; }
  unselect(cardId) { this.selected = undefined; }
  get cards() { return this.cardIds; }
  get type() { return this.cardType; }
}

export default LayerData;