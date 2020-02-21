import React, { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import { MoreVert } from '@material-ui/icons';
import { LayerData } from 'component-data';
import { CSTACK_STACK, FRAME_STACK } from 'store-consts';
import { getProjectItems } from 'store-selectors';

import CStackLayer from './CStackLayer';
import FrameStackLayer from './FrameStackLayer';
import StackLayer from './StackLayer';

function FrameStack(props) {
  const { frameId } = props;
  const items = useSelector(getProjectItems);
  const [layerList, setLayerList] = useState([new LayerData([frameId], FRAME_STACK)]);

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
  function setNextLayer(index, cardId, layer) {
    selectCard(index, cardId);
    setLayerList([...layerList, layer]);
  }
  function clearNextLayers(index) { return layerList.slice(0, index + 1); }
  function layerHasNext(index) {
    const layer = layerList[index];
    switch (layer.type) {
      case FRAME_STACK: {
        for (const cardId of layer.cards) {
          const { frames, cstacks, next } = items.frames[cardId];
          if (frames || cstacks || next) return true;
        }
        return false;
      }
      default: return false;
    }
  }
  
  const layersElem = layerList.map((layer, index) => {
    // generate layer
    let layerElem;
    switch (layer.type) {
      case CSTACK_STACK: {
        layerElem = <CStackLayer
          layer={ layer }
          onSet={ cstackId => selectCard(index, cstackId) }
          onUnset={ cstackId => unselectCard(index, cstackId) } />;
        break;
      }
      default: {
        layerElem = <FrameStackLayer
          layer={ layer }
          onSet={ (frameId, layer) => setNextLayer(index, frameId, layer) }
          onUnset={ frameId => unselectCard(index, frameId) } />;
        break;
      }
    }

    // generate ellipsis icon
    let moreElem;
    const isLast = index === layerList.length - 1;
    const hasNext = layerHasNext(index);
    if (isLast && hasNext)
      moreElem = (
        <StackLayer>
          <MoreVert color='disabled'/>
        </StackLayer>);

    return (
      <Fragment key={ index}>
        { layerElem }
        { moreElem }
      </Fragment>);
  });

  return layersElem;
}

export default FrameStack;
