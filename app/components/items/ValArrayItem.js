import React from 'react';
import { ValItem } from 'component-items';

function ValArrayItem(props) {
  const { item } = props;
  const { vals } = item;
  
  let valsElem;
  if (vals)
    valsElem = vals.map((valIds, index) => {
      const valsElem = valIds.map(valId => <ValItem key={ valId } valId={ valId } />);
      return (
        <div
          key={ index }
          style={{ flex: '1 1 auto' }}>
          { valsElem }
        </div>);
    });
    
  return (
    <div style={{ display: 'flex' }}>
      { valsElem }
    </div>);
}

export default ValArrayItem;
