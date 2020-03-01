import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { refreshEnvs } from 'viewers/EnvViewer';
import { refreshStacks } from 'viewers/StackViewer';
import { PanelViewer } from 'library/base';
import { Panel } from 'library/connected';
import { hoverNodes } from 'store/actions';
import { getPanels, getProjectItems, getSubGraphId } from 'store/selectors';

import { CONFIG_PANEL } from 'fext/store/consts';

import Config from './Config';

function ConfigViewer() {
  const configs = useSelector(state => getPanels(state, CONFIG_PANEL));
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

export default ConfigViewer;
