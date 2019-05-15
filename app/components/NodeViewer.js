import React, { Component } from 'react';

class NodeViewer extends Component {
  render() {
    const node = Object.entries(this.props.data).map(([id, data]) => {
      return (
        <div key={ id }>
          <h3>{ id }</h3>
          <p>{ (typeof data == 'object' ? data.toString() : data) }</p>
        </div>);
    });
    return <div>{ node }</div>;
  }
}

export default NodeViewer;