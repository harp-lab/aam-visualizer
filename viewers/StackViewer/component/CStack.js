import React from 'react';
import { useSelector } from 'react-redux';
import { getProjectAnalysisOutput } from 'store/selectors';

import FrameStack from './FrameStack';

function CStack(props) {
  const { cstackId } = props;
  const { cstacks } = useSelector(getProjectAnalysisOutput);

  const cstack = cstacks[cstackId];
  const frameStacks = cstack.map(frameId => {
    return <FrameStack
      key={ frameId }
      frameId={ frameId } />;
  });

  return <div style={{ margin: 5 }}>{ frameStacks }</div>;
}

export default CStack;
