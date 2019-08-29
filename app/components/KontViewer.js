import React, { useContext } from 'react';

import Panel from './Panel';
import PanelViewer from './PanelViewer';
import Context from './Context';

function KontViewer(props) {
  const { konts } = props;
  
  function hide(kontId) {
    konts[kontId].hide();
    props.onSave(konts);
  }
  function save(kontId) {
    konts[kontId].save();
    props.onSave(konts);
  }
  function unsave(kontId) {
    konts[kontId].unsave();
    props.onSave(konts);
  }
  function select(kontId) {
    konts[kontId].select();
    props.onSave(konts);
  }
  function unselect(kontId) {
    konts[kontId].unselect();
    props.onSave(konts);
  }
  function onGenerate([kontId, kont]) {
    const { label, selected, saved } = kont;

    const panelProps = {};
    if (saved)
      panelProps.onUnsave = () => unsave(kontId);
    else
      panelProps.onSave = () => save(kontId);
    if (selected)
      panelProps.onUnselect = () => unselect(kontId);
    else
      panelProps.onSelect = () => select(kontId);

    return (
      <Panel
        key={ kontId }
        label={ label }
        onMouseOver={ () => {} }
        onMouseOut={ () => {} }
        { ...panelProps }
        onDelete={ () => hide(kontId) }>
        <Kont kontId={ kontId } />
      </Panel>);
  }
  function onFilterSaved([kontId, kont]) {
    return kont.saved;
  }
  function onFilterUnsaved([kontId, kont]) {
    return !kont.saved && kont.visible;
  }

  const funcProps = { onFilterSaved, onFilterUnsaved, onGenerate };
  return <PanelViewer
    label='Stacks'
    panels={ konts }
    { ...funcProps } />;
}
function Kont(props) {
  return props.kontId;
}

export default KontViewer;