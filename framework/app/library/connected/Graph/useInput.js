import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { isFocusedGraph } from 'store/selectors';

/**
 * connect cytoscape instance global event handlers
 * @param {Object} cy cytoscape instance
 * @param {String} graphId graph id
 */
export default function useInput(cy, graphId) {
  const focused = useSelector(state => isFocusedGraph(state, graphId));
  const enabledRef = useRef(focused);

  // synchronize focused with enabled ref
  useEffect(() => { enabledRef.current = focused; }, [focused]);

  useKeydownEvent(cy, enabledRef);
}

/**
 * @param {Object} cy cytoscape instance
 * @param {Object} enabledRef event enabled flag
 */
function useKeydownEvent(cy, enabledRef) {
  /**
   * @param {Object} evt event
   */
  function keydown(evt) {
    if (enabledRef.current) {
      const selectedNodes = cy.$('node:selected');
      switch (evt.key) {
        case 'ArrowLeft':
          const prevNodes = selectedNodes.incomers().nodes();
          if (prevNodes.length == 1) {
            selectedNodes.unselect();
            prevNodes.select();
          }
          break;
        case 'ArrowRight':
          const nextNodes = selectedNodes.outgoers().nodes();
          if (nextNodes.length == 1) {
            selectedNodes.unselect();
            nextNodes.select();
          }
          break;
      }
    }
  }

  useEffect(() => {
      document.addEventListener('keydown', keydown );
      return () => { document.removeEventListener('keydown', keydown ); }
  }, []);
}
