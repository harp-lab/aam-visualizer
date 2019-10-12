import React from 'react';

function Spacer(props) {
  const { children, childrenStyle } = props;
  const spacedChildren = React.Children.map(children, child => {
    if (child)
      return React.cloneElement(child, { style: childrenStyle });
  });
  return <div>{ spacedChildren }</div>;
}

export default Spacer;
