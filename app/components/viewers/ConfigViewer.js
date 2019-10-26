import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hoverNodes, refreshEnvs, refreshStacks } from 'store-actions';
import { CSTACK_STACK, FRAME_STACK } from 'store-consts';
import { getPanels, getProjectItems, getSubGraphId } from 'store-selectors';

import { Card, CardContent, Typography } from '@material-ui/core';

import Panel from '../Panel';
import { PanelViewer, Spacer } from 'library';

import { EnvLink, StackLink } from '../links';
import { ValItem } from '../items';

function ConfigViewer() {
  const { configs } = useSelector(getPanels);
  const items = useSelector(getProjectItems);
  const subGraphId = useSelector(getSubGraphId);
  const dispatch = useDispatch();

  function refresh() {
    dispatch(refreshEnvs());
    dispatch(refreshStacks());
  }
  function onGenerate([configId, config]) {
    return (
      <Panel
        key={ configId }
        panelId={ configId }
        panelType='configs'
        onMouseOver={ () => dispatch(hoverNodes(subGraphId, [configId])) }
        onMouseOut={ () => dispatch(hoverNodes(subGraphId, [])) }
        onSelect={ refresh }
        onUnselect={ refresh }>
        <Config configId={ configId } />
      </Panel>);
  }
  function onFilterSaved([configId, config]) {
    return !['not found', 'non-func'].includes(items.configs[configId].form);
  }
  function onFilterUnsaved([configId, config]) {
    return !['not found', 'non-func'].includes(items.configs[configId].form);
  }
  const funcProps = { onFilterSaved, onFilterUnsaved };
  return <PanelViewer
    label='Configurations'
    panels={ configs }
    onGenerate={ onGenerate }
    { ...funcProps } />;
}

function Config(props) {
  const { configId } = props;
  const items = useSelector(getProjectItems);

  const { states } = items.configs[configId];
  let cards;
  if (states)
    cards = states.map(stateId => {
      const { form } = items.states[stateId];
      switch (form) {
        case 'halt':
          return undefined;
        default:
          return <StateCard
            key={ stateId }
            stateId={ stateId } />;
      }

    });
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}>
      { cards }
    </div>);
}
function StateCard(props) {
  const { stateId } = props;
  const items = useSelector(getProjectItems);

  const {
    instr: instrId,
    frame: frameId,
    cstack: cstackId,
    env: envId,
    vals: valIdSets
  } = items.states[stateId];

  const instr = items.instr[instrId]
   .exprStrings.join(', ');
  const instrElem = <Typography display='inline'>{ `[ ${ instr } ]` }</Typography>;

  const stackId = frameId ? frameId : cstackId;
  const stackType = frameId ? FRAME_STACK : CSTACK_STACK;
  const stackLink = <StackLink stackId={ stackId } { ...{ stackType } } />;
  const envElem = envId ? <EnvLink envId={ envId } /> : undefined;

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
  return(
    <Card style={{ width: '100%' }}>
      <CardContent style={{ padding: 8 }}>
        <Spacer childrenStyle={{ marginRight: 5 }}>
          { instrElem }
          { stackLink }
          { envElem }
        </Spacer>
        <div style={{ display: 'flex' }}>
          { valsElem }
        </div>
      </CardContent>
    </Card>);
}

export default ConfigViewer;
