import React from 'react';

function StackLayer(props) {
  const { children } = props;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        margin: '5px 0'
      }}>
      { children }
    </div>);
}

export default StackLayer;
