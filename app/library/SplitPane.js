import React, { useState, useRef } from 'react';

function SplitPane(props) {
  const splitElem = useRef(undefined);
  const [resize, setResize] = useState(false);

  const childProps = props.children[0].props;
  const childSize = parseInt(childProps.width || childProps.height);
  const [size, setSize] = useState(childSize);

  function drag(event) {
    if (resize) {
      unfocus();
      let size;
      const bounds = splitElem.current.getBoundingClientRect();
      if (props.horizontal)
        size = (event.clientY - bounds.y) / bounds.height * 100;
      else
        size = (event.clientX - bounds.x) / bounds.width * 100;
      setSize(size);
    }
  }
  function startDrag() { setResize(true) }
  function stopDrag() {
    if (resize)
      setResize(false);
  }
  function unfocus() {
    const selection = window.getSelection();
    if (selection)
      selection.removeAllRanges();
  }

  const otherSize = 100 - size;
  let leftPane, rightPane, resizer, cursor;
  if (props.horizontal) {
    leftPane = React.cloneElement(props.children[0], { height: `${size}%` });
    rightPane = React.cloneElement(props.children[1], { height: `${otherSize}%` });
    resizer = <Resizer horizontal onMouseDown={ startDrag } />;
    cursor = 'ns-resize';
  } else {
    leftPane = React.cloneElement(props.children[0], { width: `${size}%` });
    rightPane = React.cloneElement(props.children[1], { width: `${otherSize}%` });
    resizer = <Resizer vertical onMouseDown={ startDrag } />;
    cursor = 'ew-resize';
  }
  return (
    <div
      ref={ splitElem }
      style={ {
        display: 'flex',
        flexDirection: (props.horizontal ? 'column' : 'row'),
        flex: '1 1 auto',
        minHeight: 0,
        cursor: (resize ? cursor : 'default')
      } }
      onMouseMove={ drag }
      onMouseUp={ stopDrag }
      onMouseLeave={ stopDrag }>
      { leftPane }
      { resizer }
      { rightPane }
    </div>);
}

function Resizer(props) {
  let style = { backgroundColor: 'darkgray' };
  if (props.horizontal)
    style = { ...style, ...{
      height: 5,
      cursor: 'ns-resize'
    }};
  else
    style = { ...style, ...{
      width: 5,
      cursor: 'ew-resize'
    }};
  return <div
    style={ style }
    onMouseDown={ props.onMouseDown } />
}

export default SplitPane;
