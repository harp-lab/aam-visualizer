import React from 'react';
import { useSelector } from 'react-redux';
import { getProjectAnalysisOutput } from 'store/selectors';

import StateCard from './StateCard';

function Config(props) {
  const { configId } = props;
  const analOut = useSelector(getProjectAnalysisOutput);

  const { states } = analOut.configs[configId];
  let cards;
  if (states)
    cards = states.map(stateId => {
      const { form } = analOut.states[stateId];
      switch (form) {
        case 'halt':
          return undefined;
        default:
          return <StateCard
            key={ stateId }
            stateId={ stateId } />;
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

export default Config;
