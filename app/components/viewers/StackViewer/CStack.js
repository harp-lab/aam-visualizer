import React from 'react';
import { useSelector } from 'react-redux';
import { getProjectItems } from 'store-selectors';

import FrameStack from './FrameStack';

function CStack(props) {
  const { cstackId } = props;
  const { cstacks } = useSelector(getProjectItems);

  const cstack = cstacks[cstackId];
  const frameStacks = cstack.map(frameId => {
    return <FrameStack
      key={ frameId }
      frameId={ frameId } />;
  });

  return <div style={{ margin: 5 }}>{ frameStacks }</div>;
}

export default CStack;
