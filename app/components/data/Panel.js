class Panel {
  constructor(label) {
    this.label = label;

    this.saved = false;
    this.hidden = true;
    this.selected = true;
  }
  save() { this.saved = true }
  unsave() { this.saved = false }
  show() { this.hidden = false }
  hide() { this.hidden = true }
  select() { this.selected = true }
  unselect() { this.selected = false }
  get visible() { return this.saved || (!this.saved && !this.hidden) }
  get default() { return this.selected && !this.saved }
}

export default Panel;