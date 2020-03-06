import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, Tooltip, Typography } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import { withStyles } from '@material-ui/styles';
import { IconPopover, DebugPopover } from 'library/base';
import { getProjectAnalysisOutput } from 'store/selectors';

import { CSTACK_STACK, FRAME_STACK } from 'fext/store/consts';
import { ValArrayItem } from 'items';
import { EnvLink, StackLink } from 'links';

import LayerData from './LayerData';

function FrameCard(props) {
  const { frameId, selected, theme, classes, onSet, onUnset } = props;
  let { onClick } = props;
  const analOut = useSelector(getProjectAnalysisOutput);

  const frame = analOut.frames[frameId];
  const {
    form, type,
    frames: nextFrameIds, cstacks: nextCStackIds, next
  } = frame;

  // generate frame card label and content
  let label, content;
  switch (form) {
    case 'addr': {
      const { func: funcId, env } = frame;
      label = (
        <FrameLabel>
          <StackLink
            stackId={ frameId }
            stackType={ FRAME_STACK } />
          <FrameLabelItem label='Form'>{ form }</FrameLabelItem>
          <FrameLabelItem label='Function'>{ analOut.funcs[funcId].form }</FrameLabelItem>
          <EnvLink envId={ env } />
        </FrameLabel>);
      break;
    }
    case 'frame': {
      const { env, instr, exprString } = frame;
      const instrEntries = analOut.instr[instr]
        .exprStrings.join(', ');
      label = (
        <FrameLabel>
          <FrameLabelItem label='Type'>{ type }</FrameLabelItem>
          <EnvLink envId={ env } />
          <FrameLabelItem label='Instrumentation'>{ `[ ${instrEntries} ]` }</FrameLabelItem>
        </FrameLabel>);
      content = <Typography>{ exprString }</Typography>;
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

  // generate onClick from frame data if not defined
  if (!onClick) {
    let nextLayer;
    if (nextFrameIds) nextLayer = new LayerData(nextFrameIds, FRAME_STACK);
    else if (nextCStackIds) nextLayer = new LayerData(nextCStackIds, CSTACK_STACK);
    else if (next) nextLayer = new LayerData([next], FRAME_STACK);
    if (nextLayer) {
      if (selected) onClick = onUnset;
      else onClick = () => onSet(nextLayer);
    }
  }

  return (
    <Card
      key={ frameId }
      onClick={ onClick }
      classes={{ root: onClick ? classes.enableHover : undefined }}
      style={{
        flex: '1 0 0',
        backgroundColor: selected ? theme.palette.select.light : undefined,
        cursor: onClick ? 'pointer' : undefined,
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
            <InfoPopover content={ content } />
          </div>
        </div>
        <ValArrayItem item={ frame } />
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
  const { content } = props;
  if (content)
    return (
      <IconPopover
        icon={ <Info /> }
        tooltip='Show info'>
        { content }
      </IconPopover>);
  else return null;
}

export default FrameCard;
