import React from 'react';

function Spacer(props) {
  const { children, childrenStyle } = props;
  const spacedChildren = React.Children.map(children, child => {
    if (child) {
      const style = { ...child.props.style, ...childrenStyle };
      return React.cloneElement(child, { style });
    }
  });
  return <div>{ spacedChildren }</div>;
}

export default Spacer;
