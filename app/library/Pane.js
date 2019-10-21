import React, { useContext } from 'react';

import { ErrorBoundary, SplitPaneContext } from 'library';

function Pane(props) {
  const { overflow, children, style } = props;
  const context = useContext(SplitPaneContext);
  const { height, width } = context;

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
        { children }
      </ErrorBoundary>
    </div>);
}

export default Pane;
