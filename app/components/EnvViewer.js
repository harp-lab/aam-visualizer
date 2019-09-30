import React from 'react';
import { connect } from 'react-redux';
import { getPanels } from '../redux/selectors/panels';
import { getProjectItems } from '../redux/selectors/projects';

import { Link, Tooltip, Typography } from '@material-ui/core';

import Panel from './Panel';
import PanelTable from './PanelTable';
import PanelViewer from './PanelViewer';

function EnvViewer(props) {
  const { envs } = props;

  function onGenerate([envId, env]) {
    return (
      <Panel
        key={ envId }
        panelId={ envId }
        panelType='envs'
        onMouseOver={ () => {} } // TODO implement env hovering
        onMouseOut={ () => {} }
        disableSelect
        disableSelectMsg='No action'>
        <EnvItem
          envId={ envId }
          onAdd={ props.onAdd } />
      </Panel>);
  }

  return <PanelViewer
    label='Environments'
    panels={ envs }
    onGenerate={ onGenerate } />;
}
const mapStateToProps = state => {
  const { envs } = getPanels(state);
  const items = getProjectItems(state);
  return { envs, items };
};
export default connect(
  mapStateToProps
)(EnvViewer);

function EnvItem(props) {
  const { envId, onAdd, items } = props
  const labels = ['var', 'instr', 'store'];
  const { envs, instr, store, vals } = items;
  const env = envs[envId];
  const entries = env
    .map(entry => {
      const instrEntries = instr[entry.instr]
        .exprStrings.join(', ');
      const storeEntries = store[entry.addr]
        .map(valId => {
          const { env, type, astString, valString } = vals[valId];
          
          let string;
          switch (type) {
            case 'closure':
              string = astString;
              break;
            case 'bool':
              string = valString;
              break;
            default:
              string = `'${type}' value type unsupported`;
              break;
          }

          let addEnvLink;
          if (env)
            addEnvLink = (
              <Tooltip title='View environment'>
                <Link onClick={ () => onAdd(env) }>
                  <sup>
                    { env }
                  </sup>
                </Link>
              </Tooltip>);

          return (
            <Typography key={ valId }>
              { string }
              { addEnvLink }
            </Typography>);
        });
      return [entry.varString, `[ ${instrEntries} ]`, storeEntries]
    });
  return <PanelTable
    labels={ labels }
    entries={ entries }/>;
}
EnvItem = connect(
  state => {
    const items = getProjectItems(state);
    return { items };
  },
)(EnvItem);
