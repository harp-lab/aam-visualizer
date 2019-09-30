import React from 'react';
import { connect } from 'react-redux';
import { hoverNodes } from '../redux/actions/graphs';
import { getPanels } from '../redux/selectors/panels';
import { getProjectItems } from '../redux/selectors/projects';
import { getSubGraphId } from '../redux/selectors/graphs';

import { Card, CardContent, Typography } from '@material-ui/core';

import Panel from './Panel';
import PanelViewer from './PanelViewer';

import EnvLink from './EnvLink';
import KontLink from './KontLink';

import ValItem from './ValItem';

function ConfigViewer(props) {
  const { configs, items, hoverNodes, subGraphId } = props;

  function onGenerate([configId, config]) {
    const { label } = config;

    return (
      <Panel
        key={ configId }
        panelId={ configId }
        panelData={ config }
        label={ label }
        onMouseOver={ () => hoverNodes(subGraphId, [configId]) }
        onMouseOut={ () => hoverNodes(subGraphId, []) }
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
const mapStateToProps = state => {
  const { configs } = getPanels(state);
  const items = getProjectItems(state);
  const subGraphId = getSubGraphId(state);
  return { items, configs, subGraphId };
};
export default connect(
  mapStateToProps,
  { hoverNodes }
)(ConfigViewer);

function Config(props) {
  const { configId, items } = props;
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
Config = connect(
  state => {
    const items = getProjectItems(state);
    return { items };
  },
)(Config);
function StateCard(props) {
  const { stateId, items } = props;

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
StateCard = connect(
  state => {
    const items = getProjectItems(state);
    return { items };
  },
)(StateCard);
function StateLabel(props) {
  const { children } = props;
  const spacedChildren = React.Children.map(children, child => {
    if (child)
      return React.cloneElement(child, { style: {marginRight: '5px'} });
  });
  return <div>{ spacedChildren }</div>;
}
