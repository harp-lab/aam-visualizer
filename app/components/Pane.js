import React, { Component } from 'react';

class Pane extends Component {
  constructor(props) { super(props); }
  render() {
    const children = React.Children.map(this.props.children, children => {
      let props;
      if (this.props.width)
        props = { width: this.props.width };
      else
        props = { height: this.props.height };
      return React.cloneElement(children, props);
    });
    return <div style={ {
      display: 'flex',
      flexDirection: 'column',
      height: this.props.height ? this.props.height : '100%',
      width: this.props.width ? this.props.width : '100%'
    } }>{ children }</div>;
  }
}

export default Pane;
