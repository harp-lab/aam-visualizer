import React, { useState } from 'react';
import { LayerData } from 'component-data';
import { CSTACK_STACK } from 'store-consts';

import CStackLayer from './CStackLayer';
import FrameStackLayer from './FrameStackLayer';

function FrameStack(props) {
  const { frameId } = props;
  const [layerList, setLayerList] = useState([new LayerData([frameId])]);

  function selectCard(index, cardId) {
    const layers = clearNextLayers(index);
    const currLayer = layers[layers.length - 1];
    currLayer.select(cardId);
    setLayerList(layers);
  }
  function unselectCard(index, cardId) {
    const layers = clearNextLayers(index);
    const currLayer = layers[layers.length - 1];
    currLayer.unselect(cardId);
    setLayerList(layers);
  }
  function setNextLayer(index, frameId, layer) {
    selectCard(index, frameId);
    setLayerList([...layerList, layer]);
  }
  function clearNextLayers(index) { return layerList.slice(0, index + 1); }
  
  const layersElem = layerList.map((layer, index) => {
    switch (layer.type) {
      case CSTACK_STACK: {
        return <CStackLayer
          key={ index }
          layer={ layer }
          onSet={ cstackId => selectCard(index, cstackId) }
          onUnset={ cstackId => unselectCard(index, cstackId) } />;
      }
      default:
        return <FrameStackLayer
          key={ index }
          layer={ layer }
          onSet={ (frameId, layer) => setNextLayer(index, frameId, layer) }
          onUnset={ frameId => unselectCard(index, frameId) } />;
    }
  });

  return layersElem;
}

export default FrameStack;
