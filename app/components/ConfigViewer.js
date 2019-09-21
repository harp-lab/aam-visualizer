import React, { useContext } from 'react';
import {
  Card, CardContent,
  Link,
  Tooltip,
  Typography
} from '@material-ui/core';

import ItemContext from './ItemContext';
import Panel from './Panel';
import PanelTable from './PanelTable';
import PanelViewer from './PanelViewer';

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
        <Config
          configId={ configId }
          onShowEnv={ props.onShowEnv }
          onShowKont={ props.onShowKont } />
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
  const { configId, onShowEnv, onShowKont } = props;
  const items = useContext(ItemContext);

  const labels = ['instr', 'stack', 'env'];
  const config = items.configs[configId];
  const entries = []
  const cards = config.states.map(stateId => {
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
  /*
  config.states.forEach(stateId => {
      const { form, instr, kont, env } = items.states[stateId];
      switch (form) {
        case 'halt': {
          entries.push([]);
          break;
        }
        default: {
          const instrEntries = items.instr[instr]
            .exprStrings.join(', ');

          let kontElem;
          if (kont)
            kontElem = (
              <Tooltip title='View environment'>
                <Link onClick={ () => onShowKont(kont) }>
                  { kont }
                </Link>
              </Tooltip>);
          
          let envElem;
          if (env)
            envElem = (
              <Tooltip title='View environment'>
                <Link onClick={ () => onShowEnv(env) }>
                  { env }
                </Link>
              </Tooltip>);

          entries.push([`[ ${instrEntries} ]`, kontElem, envElem]);
          break;
        }
      }
    });
  return <PanelTable
    labels={ labels }
    entries={ entries }/>;*/
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
  const instrElem = `[ ${ instr } ]`;

  const kontElem = kontId;
  const envElem = envId;

  let valsElem;
  if (valIdSets)
    valsElem = valIdSets.map((valIds, index) => {
      const valsElem = valIds.map(valId => <ValItem valId={ valId } />);
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
        <div>
          { instrElem }
          { kontElem }
          { envElem }
        </div>
        <div style={{ display: 'flex' }}>
          { valsElem }
        </div>
      </CardContent>
    </Card>);
}

export default ConfigViewer;
