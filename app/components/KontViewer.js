import React, { Fragment, useState, useContext } from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';
import Popover from '@material-ui/core/Popover';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import withStyles from '@material-ui/styles/withStyles';
import InfoIcon from '@material-ui/icons/InfoOutlined';

import Context from './Context';
import Panel from './Panel';
import PanelViewer from './PanelViewer';

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

    const panelProps = {
      defaultExpanded: kont.default
    };
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

  function setNextLayer(index, kontId, layer) {
    const remList = clearNextLayers(index);
    const currLayer = remList[remList.length - 1];
    currLayer.select(kontId);
    setLayerList([...remList, layer]);
  }
  function unsetNextLayer(index, kontId) {
    const remList = clearNextLayers(index);
    const currLayer = remList[remList.length - 1];
    currLayer.unselect(kontId);
    setLayerList(remList);
  }
  function clearNextLayers(index) { return layerList.slice(0, index + 1) }

  const layersElem = layerList.map((layer, index) => {
    return <KontLayer
      key={ index }
      layer={ layer }
      onSet={ (kontId, layer) => setNextLayer(index, kontId, layer) }
      onUnset={ kontId => unsetNextLayer(index, kontId) } />;
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}>
      { layersElem }
    </div>);
}
function KontLayer(props) {
  const { layer } = props;
  const layerElem = layer.cards.map(kontId => {
    return <KontCard
      key={ kontId }
      kontId={ kontId }
      selected={ layer.selected == kontId }
      onSet={ props.onSet }
      onUnset={ props.onUnset } />;
  });

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        margin: '5px 0'
      }}>
      { layerElem }
    </div>);
}
function KontCard(props) {
  const { kontId, selected, theme, classes } = props;
  const items = useContext(Context);

  const { form, type, kont, konts } = items.konts[kontId];
  let label, content, nextLayer;
  switch (form) {
    case 'addr':
      label = `${kontId} ${form}`;
      content = 'TODO';
      nextLayer = new LayerData(konts);
      break;
    case 'frame':
      label = `${kontId} ${form} - ${type}`;
      content = 'TODO';
      nextLayer = new LayerData([kont]);
      break;
    default:
      label = `${kontId} ${form}`;
      break;
  }
  const style = {
    flex: '1 0 0',
    backgroundColor: selected ? theme.palette.select.light : undefined,
    cursor: nextLayer ? 'pointer' : undefined,
    minWidth: 100
  };
  const cardProps = { style };

  if (nextLayer) {
    cardProps.classes = { root: classes.enableHover };

    if (selected)
      cardProps.onClick = () => props.onUnset(kontId);
    else
      cardProps.onClick = () => props.onSet(kontId, nextLayer);
  }
  
  let infoButton;
  if (content)
    infoButton=(
      <KontInfo>
        { content }
      </KontInfo>);

  return (
    <Card
      key={ kontId }
      { ...cardProps }>
      <CardContent
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          padding: 8
        }}>
        <Typography>
          { label }
        </Typography>
        { infoButton }
      </CardContent>
    </Card>);
}
KontCard = withStyles(theme => ({
  enableHover: {
    '&:hover': { backgroundColor: `${theme.palette.hover.light} !important` }
  }
}), { withTheme: true })(KontCard);
function KontInfo(props) {
  const { children } = props;
  const [anchor, setAnchor] = useState(undefined);

  function open(evt) {
    evt.stopPropagation();
    setAnchor(evt.currentTarget);
  }
  function close(evt) { 
    evt.stopPropagation();
    setAnchor(undefined);
  }

  return (
    <Fragment>
      <Tooltip title='Show info'>
        <IconButton
          size='small'
          onClick={ open }>
          <InfoIcon />
        </IconButton>
      </Tooltip>
      <Popover
        open={ Boolean(anchor) }
        anchorEl={ anchor }
        onClose={ close }>
        { children }
      </Popover>
    </Fragment>);
}

export default KontViewer;