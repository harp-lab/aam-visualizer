import React, { Fragment, useState, useContext } from 'react';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

import withStyles from '@material-ui/styles/withStyles';

import Panel from './Panel';
import PanelViewer from './PanelViewer';
import Context from './Context';

import LayerData from './data/Layer';

function KontViewer(props) {
  const { konts } = props;
  
  function hide(kontId) {
    konts[kontId].hide();
    props.onSave(konts);
  }
  function save(kontId) {
    konts[kontId].save();
    props.onSave(konts);
  }
  function unsave(kontId) {
    konts[kontId].unsave();
    props.onSave(konts);
  }
  function select(kontId) {
    konts[kontId].select();
    props.onSave(konts);
  }
  function unselect(kontId) {
    konts[kontId].unselect();
    props.onSave(konts);
  }
  function onGenerate([kontId, kont]) {
    const { label, selected, saved } = kont;

    const panelProps = {};
    if (saved)
      panelProps.onUnsave = () => unsave(kontId);
    else
      panelProps.onSave = () => save(kontId);
    if (selected)
      panelProps.onUnselect = () => unselect(kontId);
    else
      panelProps.onSelect = () => select(kontId);

    return (
      <Panel
        key={ kontId }
        label={ label }
        onMouseOver={ () => {} }
        onMouseOut={ () => {} }
        { ...panelProps }
        onDelete={ () => hide(kontId) }>
        <Kont kontId={ kontId } />
      </Panel>);
  }
  function onFilterSaved([kontId, kont]) {
    return kont.saved;
  }
  function onFilterUnsaved([kontId, kont]) {
    return !kont.saved && kont.visible;
  }

  const funcProps = { onFilterSaved, onFilterUnsaved, onGenerate };
  return <PanelViewer
    label='Stacks'
    panels={ konts }
    { ...funcProps } />;
}
function Kont(props) {
  const { kontId } = props;
  const [layerList, setLayerList] = useState([new LayerData([kontId])]);
  const items = useContext(Context);

  function setNextLayer(index, layer) {
    const remList = layerList.slice(0, index + 1);
    const newList = [...remList, layer];
    setLayerList(newList);
  }

  const layersElem = layerList.map((layer, index) => {
    return <KontLayer
      key={ index }
      layer={ layer }
      onSet={ layer => setNextLayer(index, layer) } />;
  });

  const lastLayer = layerList[layerList.length - 1];
  let nextLayer = [];
  for (const kontId of lastLayer.cards) {
    const { form, kont, konts } = items.konts[kontId];
    switch (form) {
      case 'addr':
        nextLayer = [...nextLayer, ...konts];
        break;
      case 'frame':
        nextLayer.push(kont);
        break;
    }
  }
  function more() { setLayerList([...layerList, nextLayer]) }
  let moreButton;
  if (nextLayer.length > 0)
    moreButton = (
      <Button
        onClick={ more }
        color='inherit'
        variant='outlined'>
        more
      </Button>);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}>
      { layersElem }
      { moreButton }
    </div>);
}
function KontLayer(props) {
  const { layer } = props;
  const layerElem = layer.cards.map(kontId => {
    return <KontCard
      key={ kontId }
      kontId={ kontId }
      onSet={ props.onSet } />;
  });

  return (
    <div style={{ display: 'flex' }}>
      { layerElem }
    </div>);
}
function KontCard(props) {
  const { kontId } = props;
  const items = useContext(Context);

  const { form, type, kont, konts } = items.konts[kontId];
  let content, nextLayer;
  switch (form) {
    case 'addr':
      content = `${kontId} ${form}`;
      nextLayer = new LayerData(konts);
      break;
    case 'frame':
      content = `${kontId} ${form} - ${type}`;
      nextLayer = new LayerData([kont]);
      break;
    default:
      content = `${kontId} ${form}`;
      break;
  }
  const cardProps = {};
  if (nextLayer)
    cardProps.onClick = () => props.onSet(nextLayer);

  return (
    <Card
      key={ kontId }
      classes={{ root: props.classes.root }}
      { ...cardProps }>
      <CardContent>
        { content }
      </CardContent>
    </Card>);
}
KontCard = withStyles({
  root: { flex: '1 1 auto' }
})(KontCard);

export default KontViewer;