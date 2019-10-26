import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, Tooltip, Typography } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import withStyles from '@material-ui/styles/withStyles';
import { FRAME_STACK, CSTACK_STACK } from 'store-consts';
import { getProjectItems } from 'store-selectors';
import { LayerData } from 'component-data';
import { ValItem } from 'component-items';
import { EnvLink, StackLink } from 'component-links';
import { IconPopover, DebugPopover } from 'library';

function FrameCard(props) {
  const { frameId, selected, theme, classes, onSet, onUnset } = props;
  const items = useSelector(getProjectItems);

  const frame = items.frames[frameId];
  const { form, type, vals: valIdSets } = frame;

  let label, content, nextLayer;
  switch (form) {
    case 'addr': {
      const { func: funcId, env, frames: nextFrameIds, cstacks: nextCStackIds } = frame;
      label = (
        <FrameLabel>
          <StackLink
            stackId={ frameId }
            stackType={ FRAME_STACK } />
          <FrameLabelItem label='Form'>{ form }</FrameLabelItem>
          <FrameLabelItem label='Function'>{ items.funcs[funcId].form }</FrameLabelItem>
          <EnvLink envId={ env } />
        </FrameLabel>);
      if (nextFrameIds) nextLayer = new LayerData(nextFrameIds);
      else nextLayer = new LayerData(nextCStackIds, CSTACK_STACK);
      break;
    }
    case 'frame': {
      const { env, instr, exprString, next } = frame;
      const instrEntries = items.instr[instr]
        .exprStrings.join(', ');
      label = (
        <FrameLabel>
          <FrameLabelItem label='Type'>{ type }</FrameLabelItem>
          <EnvLink envId={ env } />
          <FrameLabelItem label='Instrumentation'>{ `[ ${instrEntries} ]` }</FrameLabelItem>
        </FrameLabel>);
      content = <Typography>{ exprString }</Typography>;
      nextLayer = new LayerData([next]);
      break;
    }
    default:
      label = (
        <FrameLabel>
          <StackLink
            stackId={ frameId }
            stackType={ FRAME_STACK } />
          <FrameLabelItem label='Form'>{ form }</FrameLabelItem>
        </FrameLabel>);
      break;
  }

  const cardProps = {};
  if (nextLayer) {
    cardProps.classes = { root: classes.enableHover };
    if (selected) cardProps.onClick = () => onUnset();
    else cardProps.onClick = () => onSet(nextLayer);
  }
  
  const infoButton = content ? <InfoPopover>{ content }</InfoPopover> : null;

  let valsElem;
  if (valIdSets)
    valsElem = valIdSets.map((valIds, index) => {
      const valsElem = valIds.map(valId => <ValItem key={ valId } valId={ valId } />);
      return (
        <div
          key={ index }
          style={{ flex: '1 1 auto' }}>
          { valsElem }
        </div>);
    });
  return (
    <Card
      key={ frameId }
      { ...cardProps }
      style={{
        flex: '1 0 0',
        backgroundColor: selected ? theme.palette.select.light : undefined,
        cursor: nextLayer ? 'pointer' : undefined,
        minWidth: 100
      }}>
      <CardContent style={{ padding: 8 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}>
          { label }
          <div>
            <DebugPopover item={ frame } />
            { infoButton }
          </div>
        </div>
        <div style={{ display: 'flex' }}>{ valsElem }</div>
      </CardContent>
    </Card>);
}
FrameCard = withStyles(theme => ({
  enableHover: {
    '&:hover': { backgroundColor: `${theme.palette.hover.light} !important` }
  }
}), { withTheme: true })(FrameCard);

function FrameLabel(props) {
  const { children } = props;
  const spacedChildren = React.Children.map(children, child => {
    return React.cloneElement(child, { style: {marginRight: '5px'} });
  });
  return <div>{ spacedChildren }</div>;
}
function FrameLabelItem(props) {
  const { label, children, style } = props;
  return (
    <Tooltip title={ label }>
      <Typography display='inline' { ...{ style } }>
        { children }
      </Typography>
    </Tooltip>);
}

function InfoPopover(props) {
  const { children } = props;
  return (
    <IconPopover
      icon={ <Info /> }
      tooltip='Show info'>
      { children }
    </IconPopover>);
}

export default FrameCard;
