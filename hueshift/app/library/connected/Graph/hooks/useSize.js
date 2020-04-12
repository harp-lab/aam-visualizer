import { useEffect, useRef } from 'react';

/**
 * Resize cytoscape instance on container size change
 * @param {Object} cyElemRef cytoscape container element
 * @param {Object} cy cytoscape instance
 */
export default function useSize(cyElemRef, cy) {
  const boundsRef = useRef(undefined);

  useEffect(() => { boundsRef.current = cyElemRef.current.getBoundingClientRect(); }); // get current bounds
  useEffect(() => { cy.resize(); }, [boundsRef.current]); // resize cytoscape on bound changes
}
