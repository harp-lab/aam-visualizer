import React, { useContext } from 'react';
import { Card, CardContent, Typography } from '@material-ui/core';

import ItemContext from './ItemContext';
import Panel from './Panel';
import PanelViewer from './PanelViewer';

import EnvLink from './EnvLink';
import KontLink from './KontLink';

import ValItem from './ValItem';

function ConfigViewer(props) {
  const { configs } = props;
  const items = useContext(ItemContext);

  function onGenerate([configId, config]) {
    const { label } = config;

    return (
      <Panel
        key={ configId }
        panelId={ configId }
        panelData={ config }
        label={ label }
        onMouseOver={ () => props.onHover([configId]) }
        onMouseOut={ () => props.onHover([]) }
        onSelect={ props.onRefresh }
        onUnselect={ props.onRefresh }
        onSave={ props.onSave }>
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
  const items = useContext(ItemContext);

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
            stateId={ stateId }/>;
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
  const items = useContext(ItemContext);

  const {
    instr: instrId,
    kont: kontId,
    env: envId,
    vals: valIdSets
  } = items.states[stateId];

  const instr = items.instr[instrId]
   .exprStrings.join(', ');
  const instrElem = <Typography display='inline' >{ `[ ${ instr } ]` }</Typography>;

  const kontElem = <KontLink kontId={ kontId } />;
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
        <StateLabel>
          { instrElem }
          { kontElem }
          { envElem }
        </StateLabel>
        <div style={{ display: 'flex' }}>
          { valsElem }
        </div>
      </CardContent>
    </Card>);
}
function StateLabel(props) {
  const { children } = props;
  const spacedChildren = React.Children.map(children, child => {
    if (child)
      return React.cloneElement(child, { style: {marginRight: '5px'} });
  });
  return <div>{ spacedChildren }</div>;
}

export default ConfigViewer;
