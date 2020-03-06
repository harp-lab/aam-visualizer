import React from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, Typography } from '@material-ui/core';
import { EnvLink, StackLink } from 'links';
import { ValArrayItem } from 'items';
import { Spacer } from 'library/base';
import { getProjectAnalysisOutput } from 'store/selectors';

import { CSTACK_STACK, FRAME_STACK } from 'fext/store/consts';

function StateCard(props) {
  const { stateId } = props;
  const analOut = useSelector(getProjectAnalysisOutput);
  const state = analOut.states[stateId];
  const {
    instr: instrId,
    frame: frameId,
    cstack: cstackId,
    env: envId
  } = state;

  const instr = analOut.instr[instrId]
   .exprStrings.join(', ');
  const instrElem = <Typography display='inline'>{ `[ ${ instr } ]` }</Typography>;

  const stackId = frameId ? frameId : cstackId;
  const stackType = frameId ? FRAME_STACK : CSTACK_STACK;
  const stackLink = <StackLink stackId={ stackId } { ...{ stackType } } />;
  const envElem = envId ? <EnvLink envId={ envId } /> : undefined;

  return(
    <Card style={{ width: '100%' }}>
      <CardContent style={{ padding: 8 }}>
        <Spacer childrenStyle={{ marginRight: 5 }}>
          { instrElem }
          { stackLink }
          { envElem }
        </Spacer>
        <ValArrayItem item={ state } />
      </CardContent>
    </Card>);
}

export default StateCard;
