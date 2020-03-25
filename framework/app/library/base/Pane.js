import React, { useContext, useState, useCallback } from 'react';
import { ErrorBoundary, PaneContext, SplitPaneContext } from 'library/base';

/**
 * base ui layout component
 * @param {Object} props 
 * @param {String} props.overflow overflow css style
 * @param {Object} props.style css style override
 */
function Pane(props) {
  const { overflow, children, style } = props;
  const { height, width } = useContext(SplitPaneContext);
  const [toolbarWidth, setToolbarWidth] = useState(0);
  const updateToolbar = useCallback(elem => {
    if (elem)
      setToolbarWidth(elem.offsetWidth);
  }, []);

  // get PaneContent and PaneToolbar children
  let content, toolbar;
  React.Children.forEach(children, child => {
    const { type } = child;
    if (type.name === 'PaneContent') {
      content = child;
    } else if (type.$$typeof && type.$$typeof === Symbol.for('react.forward_ref')) {
      if (type.render.name === 'PaneToolbar')
        toolbar = child;
    }
  });

  let elem;
  if (content && toolbar) {
    // structure output and provide context if PaneContent and PaneToolbar defined
    content = React.cloneElement(content, { style: { width: `calc(100% - ${toolbarWidth}px)` } });
    toolbar = React.cloneElement(toolbar, { ref: updateToolbar });
    elem = (
      <PaneContext.Provider
        value={{
          toolbarWidth
        }}>
        { content }
        { toolbar }
      </PaneContext.Provider>);
  } else {
    // default output
    elem = children;
  }

  return (
    <div
      style={{
        ...{
          display: 'flex',
          flexDirection: 'column',
          height: height ? height : '100%',
          width: width ? width : '100%',
          overflow: overflow ? overflow : 'hidden'
        },
        ...style
      }}>
      <ErrorBoundary>
        { elem }
      </ErrorBoundary>
    </div>);
}

export default Pane;
