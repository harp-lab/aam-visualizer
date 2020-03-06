import React, { Fragment } from 'react';
import { useSelector } from 'react-redux';
import { getProjectAnalysisOutput } from 'store/selectors';

import CStack from './CStack';
import FrameCard from './FrameCard';
import StackLayer from './StackLayer';

function CStackLayer(props) {
  const { layer, onSet, onUnset } = props;

  const cstackCards = layer.cards.map(cstackId => {
    return <CStackCard
      key={ cstackId }
      cstackId={ cstackId }
      selected={ layer.selected === cstackId }
      onSet={ onSet }
      onUnset={ onUnset } />;
  });

  return (
    <Fragment>
      <StackLayer>{ cstackCards }</StackLayer>
      { layer.selected ? <CStack cstackId={ layer.selected } /> : null }
    </Fragment>);
}
function CStackCard(props) {
  const { cstackId, selected, onSet, onUnset } = props;
  const { cstacks } = useSelector(getProjectAnalysisOutput);

  const cstack = cstacks[cstackId];
  const frameId = cstack[0];
  const onClick = selected ? () => onUnset(cstackId) : () => onSet(cstackId);

  return <FrameCard
    frameId={ frameId }
    selected={ selected }
    onClick={ onClick } />;
}

export default CStackLayer;
