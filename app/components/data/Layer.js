class Layer {
  constructor(cardIds) {
    this.cardIds = cardIds;
    this.selected = undefined;
  }
  select(cardId) { this.selected = cardId }
  get cards() { return this.cardIds }
}

export default Layer;