import React, { Fragment, useState, createContext } from 'react';
import { connect } from 'react-redux';
import { getPanels } from '../redux/selectors/panels';
import { getProjectItems } from '../redux/selectors/projects';

import {
  Card, CardContent,
  IconButton,
  Popover,
  Tooltip,
  Typography
} from '@material-ui/core';
import { Info } from '@material-ui/icons';
import withStyles from '@material-ui/styles/withStyles';

import Panel from './Panel';
import PanelViewer from './PanelViewer';

import EnvLink from './EnvLink';
import KontLink from './KontLink';

import LayerData from './data/Layer';

const KontContext = createContext();

function KontViewer(props) {
  const { konts, onShowEnv } = props;
  
  function onGenerate([kontId, kont]) {
    return (
      <Panel
        key={ kontId }
        panelId={ kontId }
        panelType='konts'
        onMouseOver={ () => {} }
        onMouseOut={ () => {} }
        disableSelect
        disableSelectMsg='No action'>
        <KontContext.Provider value={{ onShowEnv }}>
          <Kont kontId={ kontId } />
        </KontContext.Provider>
      </Panel>);
  }

  return <PanelViewer
    label='Stacks'
    panels={ konts }
    onGenerate={ onGenerate } />;
}
const mapStateToProps = state => {
  const { konts } = getPanels(state);
  return { konts };
};
export default connect(
  mapStateToProps
)(KontViewer);
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
  const { kontId, selected, items, theme, classes } = props;

  const kont = items.konts[kontId];
  const { form, type } = kont;
  let label, content, nextLayer;

  switch (form) {
    case 'addr': {
      const { func: funcId, env, konts: nextKontIds } = kont;
      label = (
        <KontLabel>
          <KontLink kontId={  kontId } />
          <KontLabelItem label='Form'>{ form }</KontLabelItem>
          <KontLabelItem label='Function'>{ items.funcs[funcId].form }</KontLabelItem>
          <EnvLink envId={ env } />
        </KontLabel>);
      nextLayer = new LayerData(nextKontIds);
      break;
    }
    case 'frame': {
      const { env, instr, exprString, kont: nextKontId } = kont;
      const instrEntries = items.instr[instr]
        .exprStrings.join(', ');
      label = (
        <KontLabel>
          <KontLabelItem label='Type'>{ type }</KontLabelItem>
          <EnvLink envId={ env } />
          <KontLabelItem label='Instrumentation'>{ `[ ${instrEntries} ]` }</KontLabelItem>
        </KontLabel>);
      content = (
        <Typography>
          { exprString }
        </Typography>);
      nextLayer = new LayerData([nextKontId]);
      break;
    }
    default:
      label = (
        <KontLabel>
          <KontLink kontId={  kontId } />
          <KontLabelItem label='Form'>{ form }</KontLabelItem>
        </KontLabel>);
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
    infoButton = <KontInfo>{ content }</KontInfo>;

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
        { label }
        { infoButton }
      </CardContent>
    </Card>);
}
KontCard = withStyles(theme => ({
  enableHover: {
    '&:hover': { backgroundColor: `${theme.palette.hover.light} !important` }
  }
}), { withTheme: true })(KontCard);
KontCard = connect(
  state => {
    const items = getProjectItems(state);
    return { items };
  },
)(KontCard);

function KontLabel(props) {
  const { children } = props;
  const spacedChildren = React.Children.map(children, child => {
    return React.cloneElement(child, { style: {marginRight: '5px'} });
  });
  return <div>{ spacedChildren }</div>;
}
function KontLabelItem(props) {
  const { label, children, style } = props;
  return (
    <Tooltip title={ label }>
      <Typography display='inline' { ...{ style } }>
        { children }
      </Typography>
    </Tooltip>);
}
function KontInfo(props) {
  const { children, classes } = props;
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
          <Info />
        </IconButton>
      </Tooltip>
      <Popover
        open={ Boolean(anchor) }
        anchorEl={ anchor }
        onClose={ close }
        classes={{ paper: classes.paper }}>
        { children }
      </Popover>
    </Fragment>);
}
KontInfo = withStyles({
  paper: { padding: '1em' }
})(KontInfo);
