import React, { useState, useRef } from 'react';

import { SplitPaneContext } from 'library/base';

function SplitPane(props) {
  const { horizontal, children, style } = props;
  const splitElem = useRef(undefined);
  const [resize, setResize] = useState(false);

  const child1Props = children[0].props;
  const child1Size = parseInt(child1Props.width || child1Props.height);
  const [size, setSize] = useState(child1Size);

  function drag(evt) {
    if (resize) {
      unfocus();
      const bounds = splitElem.current.getBoundingClientRect();
      let size;
      if (horizontal)
        size = (evt.clientY - bounds.y) / bounds.height * 100;
      else
        size = (evt.clientX - bounds.x) / bounds.width * 100;
      setSize(size);
    }
  }
  function startDrag() { setResize(true); }
  function stopDrag() { if (resize) setResize(false); }
  function unfocus() {
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
  }

  let childProp, resizerProp, cursor;
  if (horizontal) {
    childProp = 'height';
    resizerProp = 'horizontal';
    cursor = 'ns-resize';
  } else {
    childProp = 'width';
    resizerProp = 'vertical';
    cursor = 'ew-resize';
  }
  const [pane1, pane2] = children;

  return (
    <div
      ref={ splitElem }
      style={{
        display: 'flex',
        flexDirection: horizontal ? 'column' : 'row',
        flex: '1 1 auto',
        cursor: resize ? cursor : 'default', // TODO make cursor styling apply for all inner elements
        minHeight: 0,
        ...style
      }}
      onMouseMove={ drag }
      onMouseUp={ stopDrag }
      onMouseLeave={ stopDrag }>
        <SplitPaneContext.Provider value={{ [childProp]: `${size}%` }}>
          { pane1 }
        </SplitPaneContext.Provider>
        <Resizer
          { ...{ [resizerProp]: true } }
          onMouseDown={ startDrag } />
        <SplitPaneContext.Provider value={{ [childProp]: `${100 - size}%` }}>
          { pane2 }
        </SplitPaneContext.Provider>
    </div>);
}

function Resizer(props) {
  const { horizontal, onMouseDown } = props;
  let style;
  if (horizontal)
    style = {
      height: 5,
      cursor: 'ns-resize'
    };
  else
    style = {
      width: 5,
      cursor: 'ew-resize'
    };
  return <div
    style={{
      backgroundColor: 'darkgray',
      ...style
    }}
    onMouseDown={ onMouseDown } />;
}

export default SplitPane;
