import React from 'react';

import ConfigViewer from './ConfigViewer';
import EnvViewer from './EnvViewer';
import Pane from './Pane';
import SplitPane from './SplitPane';

function PropViewer(props) {
    const { metadata } = props;
    const { configs, envs } = metadata;
    
    function addEnv(envId) {
      envs[envId].show();
      props.onSave({ envs: envs });
    }

    return (
      <SplitPane>
        <Pane width="50%" overflow='auto'>
          <ConfigViewer
            configs={ configs }
            onAdd={ addEnv }
            onHover={ props.onHover }
            onSave={ configs => props.onSave({ configs }) }
            onRefresh={ props.onRefreshEnvs } />
        </Pane>
        <Pane width="50%" overflow='auto'>
          <EnvViewer
            envs={ envs }
            onAdd={ addEnv }
            onSave={ envs => props.onSave({ envs }) } />
        </Pane>
      </SplitPane>);
}

export default PropViewer;
