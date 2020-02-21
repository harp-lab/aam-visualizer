import React from 'react';
import { useSelector } from 'react-redux';
import { ValItem } from 'component-items';
import { PanelTable } from 'library/base';
import { getProjectItems } from 'store-selectors';

/**
 * Renders env item
 * @param {Object} props component props
 * @param {String} props.envId env id
 */
function EnvItem(props) {
  const { envId } = props
  const items = useSelector(getProjectItems);

  const labels = ['var', 'instr', 'store'];
  const { envs, instr, store, vals } = items;
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
