class Layer {
  constructor(cardIds) {
    this.cardIds = cardIds;
    this.selected = undefined;
  }
  select(cardId) { this.selected = cardId }
  unselect(cardId) { this.selected = undefined }
  get cards() { return this.cardIds }
}

export default Layer;