import React from 'react';
import { useSelector } from 'react-redux';
import { ValItem } from 'items';
import { PanelTable } from 'library/base';
import { getProjectAnalysisOutput } from 'store/selectors';

/**
 * Renders env item
 * @param {Object} props component props
 * @param {String} props.envId env id
 */
function EnvItem(props) {
  const { envId } = props
  const analOut = useSelector(getProjectAnalysisOutput);

  const labels = ['var', 'instr', 'store'];
  const { envs, instr, store, vals } = analOut;
  const env = envs[envId];
  const entries = env.entries
    .map(entry => {
      const instrEntries = instr[entry.instr]
        .exprStrings.join(', ');
      const storeEntries = store[entry.addr]
        .map(valId => {
          return <ValItem
            key={ valId }
            valId={ valId } />;
        });
      return [entry.label, `[ ${instrEntries} ]`, storeEntries]
    });
  return <PanelTable
    labels={ labels }
    entries={ entries }/>;
}

export default EnvItem;
