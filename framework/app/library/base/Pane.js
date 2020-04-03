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
      <ContentContainer
        overflow={ overflow }
        style={{
          flexDirection: 'row'
        }}>
        <PaneContext.Provider
          value={{
            toolbarWidth
          }}>
          { content }
          { toolbar }
        </PaneContext.Provider>
      </ContentContainer>);
  } else {
    // default output
    elem = (
      <ContentContainer
        overflow={ overflow }
        style={ style }>
        { children }
      </ContentContainer>);
  }

  return elem;
}

export default Pane;

/**
 * @param {Object} props 
 * @param {String} [props.overflow = 'hidden']
 * @param {String} [props.height = '100%']
 * @param {String} [props.width = '100%']
 * @param {Object} [props.style]
 */
function ContentContainer(props) {
  const {
    overflow = 'hidden',
    children, style } = props;
  const {
    height = '100%',
    width = '100%'
  } = useContext(SplitPaneContext);

  return (
    <div
      style={{
        ...{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height, width,
          overflow
        },
        ...style
      }}>
      <SplitPaneContext.Provider
        value={{
          height: '100%',
          width: '100%'
        }}>
        <ErrorBoundary>
          { children }
        </ErrorBoundary>
      </SplitPaneContext.Provider>
    </div>);
}
