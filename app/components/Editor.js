import React, { Component } from 'react';
import Menu from './Menu';
import codemirror from 'codemirror/lib/codemirror';
import 'codemirror/mode/scheme/scheme';

class Editor extends Component {
  constructor(props) {
    super(props);

    this.process = this.process.bind(this);
  }
  set value(data) { this.cm.getDoc().setValue(data); }
  get value() { return this.cm.getDoc().getValue(); }
  
  save() {
    this.props.onSave(this.value);
  }
  process() {
    this.props.onProcess(this.value);
  }
  refresh() {
    this.value = this.props.data;
    if (this.props.marks){
      this.clearMarks();
      this.renderMarks();
    }
  }
  renderMarks() {
    const doc = this.cm.getDoc();
    for (const [id, mark] of Object.entries(this.props.marks)) {
      const element = document.createElement('sup');
      element.style.cssText = 'cursor: pointer';
      element.classList.add('mark');
      element.textContent = id;
      element.addEventListener('click', event => {
        this.props.onSelect(id);
      });
      doc.setBookmark(mark.end, { widget: element, insertLeft: true });
    }
  }
  selectMark() {
    const selectedId = this.props.selected;
    if (this.selectedMark)
      this.selectedMark.clear();
    if (selectedId) {
      const mark = this.props.marks[selectedId];
      if (mark) {
        const doc = this.cm.getDoc();
        doc.setCursor(mark.start);
        this.selectedMark = doc.markText(mark.start, mark.end, {
          className: 'selected',
          css: 'background-color: #f4d03f' });
      }
    }
  }
  clearMarks() {
    const doc = this.cm.getDoc();
    doc.getAllMarks().forEach(marker => marker.clear());
  }

  componentDidMount() {
    const cmConfig = {
      lineWrapping: true,
      lineNumbers: true,
      readOnly: (!this.props.edit)
    };

    this.cm = codemirror(this.cmRef, cmConfig);
    this.refresh();
  }
  componentDidUpdate(prevProps) {
    const idUpdate = this.props.id !== prevProps.id;
    const typeUpdate = this.props.type !== prevProps.type;
    if (idUpdate || typeUpdate)
      this.refresh();
    
    if (this.props.selected !== prevProps.selected)
      this.selectMark();
  }
  componentWillUnmount() {
    if (this.props.edit)
      this.save();
  }
  render() {
    const editorButtons = [
      { label: 'process', onClick: this.process }
    ];
    return (
      <div style={ { 
        display: 'flex',
        flexDirection: 'column',
        height: '100%' } }>
        <div
          ref={ ref => this.cmRef = ref }
          style={ { height: '100%' } } />
        { this.props.edit && <Menu data={ editorButtons }/> }
      </div>
    );
  }
}

export default Editor;
