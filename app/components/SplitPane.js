import React, { Component } from 'react';

class Resizer extends Component {
  render() {
    let style = { backgroundColor: 'darkgray', };
    if (this.props.horizontal) {
      style.height = 5;
      style.cursor = 'ns-resize';
    }
    else {
      style.width = 5;
      style.cursor = 'ew-resize';
    }
    return <div
      style={ style }
      onMouseDown={ this.props.onMouseDown } />
  }
}

class SplitPane extends Component {
  constructor(props) {
    super(props);

    const size = 50;
    const resize = false;
    this.state = { resize, size };

    this.drag = this.drag.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.stopDrag = this.stopDrag.bind(this);
  }
  drag(event) {
    if (this.state.resize) {
      this.unfocus();
      let size;
      const bounds = this.spRef.getBoundingClientRect();
      if (this.props.horizontal)
        size = (event.clientY - bounds.y) / bounds.height * 100;
      else
        size = (event.clientX - bounds.x) / bounds.width * 100;
      this.setState({ size });
    }
  }
  startDrag() { this.setState({ resize: true }); }
  stopDrag() { this.setState({ resize: false }); }
  unfocus() {
    const selection = window.getSelection();
    if (selection)
      selection.removeAllRanges();
  }
  render() {
    const otherSize = 100 - this.state.size;
    let leftPane, rightPane, resizer, cursor;
    if (this.props.horizontal) {
      leftPane = React.cloneElement(this.props.children[0], { height: `${this.state.size}%` });
      rightPane = React.cloneElement(this.props.children[1], { height: `${otherSize}%` });
      resizer = <Resizer horizontal onMouseDown={ this.startDrag } />;
      cursor = 'ns-resize';
    } else {
      leftPane = React.cloneElement(this.props.children[0], { width: `${this.state.size}%` });
      rightPane = React.cloneElement(this.props.children[1], { width: `${otherSize}%` });
      resizer = <Resizer vertical onMouseDown={ this.startDrag } />;
      cursor = 'ew-resize';
    }
    return <div
      ref={ ref => this.spRef = ref }
      style={ {
        display: 'flex',
        flexDirection: (this.props.horizontal ? 'column' : 'row'),
        flex: '1 1 auto',
        minHeight: 0,
        cursor: (this.state.resize ? cursor : 'default')
      } }
      onMouseMove={ this.drag }
      onMouseUp={ this.stopDrag }
      onMouseLeave={ this.stopDrag }>
      { leftPane }
      { resizer }
      { rightPane }
    </div>;
  }
}

export default SplitPane;