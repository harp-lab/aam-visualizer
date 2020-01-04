import React, { Fragment } from 'react';

function Spacer(props) {
  const { children, childrenStyle, noDiv } = props;
  const spacedChildren = React.Children.map(children, child => {
    if (child) {
      const style = { ...child.props.style, ...childrenStyle };
      return React.cloneElement(child, { style });
    }
  });

  let element;
  if (noDiv)
    element = <Fragment>{ spacedChildren }</Fragment>;
  else
    element = <div>{ spacedChildren }</div>;
  return element;
}

export default Spacer;
