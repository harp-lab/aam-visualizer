import React from 'react';
import { useSelector } from 'react-redux';
import { PanelViewer } from 'library/base';
import { Panel } from 'library/connected';
import { STACK_PANEL, FRAME_STACK, CSTACK_STACK } from 'store/consts';
import { getPanels } from 'store/selectors';

import CStack from './CStack';
import FrameStack from './FrameStack';

function StackViewer() {
  const stacks = useSelector(state => getPanels(state, STACK_PANEL));
  
  function onGenerate([stackId, stack]) {
    const { [FRAME_STACK]: frameId, [CSTACK_STACK]: cstackId } = stack;
    let stackElem;
    if (frameId)
      stackElem = <FrameStack frameId={ frameId } />;
    else
      stackElem = <CStack cstackId={ cstackId } />
    return (
      <Panel
        key={ stackId }
        panelId={ stackId }
        panelType={ STACK_PANEL }
        onMouseOver={ () => {} }
        onMouseOut={ () => {} }
        disableSelect
        disableSelectMsg='No action'>
        <div style={{ width: '100%' }}>{ stackElem }</div>
      </Panel>);
  }

  return <PanelViewer
    label='Stacks'
    panels={ stacks }
    onGenerate={ onGenerate } />;
}

export default StackViewer;
