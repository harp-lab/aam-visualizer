import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button'

class Menu extends Component {
  render() {
    const buttons = this.props.data.map((button) => {
      return (
        <Button
          key={ button.label }
          onClick={ (event) => {
            event.stopPropagation();
            button.onClick();
          } }
          color={ button.color }
          variant={ button.variant }>
          { button.label }
        </Button>
      );
    });
    return <div>{ buttons }</div>;
  }
};

export default Menu;
