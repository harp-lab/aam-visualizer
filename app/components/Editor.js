import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Toolbar from '@material-ui/core/Toolbar';
import codemirror from 'codemirror/lib/codemirror';
import 'codemirror/mode/scheme/scheme';

class Editor extends Component {
  constructor(props) {
    super(props);

    let processOptions;
    if (this.props.processOptions) {
      const analysis = this.props.processOptions.analysis[0];
      processOptions = { analysis };
    }
    this.state = { processOptions };

    this.process = this.process.bind(this);
  }
  set value(data) { this.cm.getDoc().setValue(data); }
  get value() { return this.cm.getDoc().getValue(); }
  save() { this.props.onSave(this.value); }
  process() { this.props.onProcess(this.value, this.state.processOptions); }
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
        this.props.onNodeSelect(mark.graphId, id);
      });
      doc.setBookmark(mark.end, { widget: element, insertLeft: true });
    }
  }
  selectMark() {
    const selectedId = this.props.selected;
    const doc = this.cm.getDoc();

    // unselect previous mark
    let marks;
    if (this.selectedMark) {
      this.selectedMark.clear();

      // unhighlight bookmarks in range
      marks = doc.getAllMarks();
      marks.forEach(mark => {
        if (mark.type == 'bookmark')
          mark.widgetNode.classList.remove('selected');
      });
    }
    
    
    if (selectedId) {
      const mark = this.props.marks[selectedId];
      if (mark) {
        doc.setCursor(mark.start);

        this.selectedMark = doc.markText(mark.start, mark.end, {
          className: 'selected'});

        // highlight bookmarks in range
        marks = doc.findMarks(mark.start, mark.end);
        marks.forEach(mark => {
          if (mark.type == 'bookmark')
            mark.widgetNode.classList.add('selected');
        });
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
    this.selectMark();
  }
  componentDidUpdate(prevProps) {
    const dataUpdate = this.props.data !== prevProps.data;
    const idUpdate = this.props.id !== prevProps.id;
    const typeUpdate = this.props.type !== prevProps.type;
    if (dataUpdate || idUpdate || typeUpdate)
      this.refresh();
    
    if (this.props.selected !== prevProps.selected)
      this.selectMark();
  }
  componentWillUnmount() {
    if (this.props.edit)
      this.save();
  }
  render() {
    let editMenu;
    if (this.props.edit) {
      const processOptions = this.props.processOptions;
      const analysisOptions = processOptions.analysis;
      const analysisMenuItems = analysisOptions.map(option => {
        return <MenuItem key={ option } value={ option }>{ option }</MenuItem>
      });
      editMenu = (
        <Toolbar>
          <Select
            value={ this.state.processOptions.analysis }
            onChange={ event => {
              console.log(event);
              const analysis = event.target.value;
              this.setState(state => {
                const processOptions = state.processOptions;
                processOptions.analysis = analysis;
                return { processOptions };
              });
            } }>
            { analysisMenuItems }
          </Select>
          <ProcessButton onClick={ this.process }/>
        </Toolbar>
      );
    }
    return (
      <div style={ { 
        display: 'flex',
        flexDirection: 'column',
        height: '100%' } }>
        <div
          ref={ ref => this.cmRef = ref }
          style={ { height: '100%' } } />
        { editMenu }
      </div>
    );
  }
}

class ProcessButton extends Component {
  render() {
    return <Button
      onClick={ (event) => {
        this.props.onClick();
      } }
      color='inherit'
      variant='outlined'>
      process
    </Button>;
  }
}

export default Editor;
