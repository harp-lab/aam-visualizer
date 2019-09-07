import React, { Fragment, useState, useContext, createContext } from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';
import Link from '@material-ui/core/Link';
import Popover from '@material-ui/core/Popover';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import withStyles from '@material-ui/styles/withStyles';
import InfoIcon from '@material-ui/icons/InfoOutlined';

import Context from './Context';
import Panel from './Panel';
import PanelViewer from './PanelViewer';

import LayerData from './data/Layer';

const KontContext = createContext();

function KontViewer(props) {
  const { konts, onShowEnv } = props;
  
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
      defaultExpanded: kont.default,
      disableSelect: true,
      disableSelectMsg: 'No action'
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
        <KontContext.Provider value={{ onShowEnv }}>
          <Kont kontId={ kontId } />
        </KontContext.Provider>
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

  const kont = items.konts[kontId];
  const { form, type } = kont;
  let label, content, nextLayer;

  switch (form) {
    case 'addr': {
      const { func: funcId, env, konts: nextKontIds } = kont;
      label = (
        <Typography>
          { `${kontId} ${form} func ${items.funcs[funcId].form}` }
          <EnvLink envId={ env } />
        </Typography>);
      nextLayer = new LayerData(nextKontIds);
      break;
    }
    case 'frame': {
      const { env, instr, exprString, kont: nextKontId } = kont;
      const instrEntries = items.instr[instr]
        .exprStrings.join(', ');
      label = (
        <Typography>
          { `${type}` }
          <EnvLink envId={ env } />
          { `[ ${instrEntries} ]` }
        </Typography>);
      content = (
        <Typography>
          { exprString }
        </Typography>);
      nextLayer = new LayerData([nextKontId]);
      break;
    }
    default:
      label = <Typography>{ `${kontId} ${form}` }</Typography>;
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
          <InfoIcon />
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

function EnvLink(props) {
  const { envId } = props;
  const kontContext = useContext(KontContext);
  return (
    <Tooltip title='View environment'>
      <Link
        onClick={ evt => {
          evt.stopPropagation();
          kontContext.onShowEnv(envId);
        } }
        style={{ margin: '0 5px' }}>
        { envId }
      </Link>
    </Tooltip>);
}

export default KontViewer;