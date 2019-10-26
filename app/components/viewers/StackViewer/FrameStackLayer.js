import React from 'react';
import FrameCard from './FrameCard';
import StackLayer from './StackLayer';

function FrameStackLayer(props) {
  const { layer, onSet, onUnset } = props;

  const frameCards = layer.cards.map(frameId => {
    return <FrameCard
      key={ frameId }
      frameId={ frameId }
      selected={ layer.selected === frameId }
      onSet={ layer => onSet(frameId, layer) }
      onUnset={ () => onUnset(frameId) } />;
  });

  return <StackLayer>{ frameCards }</StackLayer>;
}

export default FrameStackLayer;
