import React, { useState } from 'react';
import {
  ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails,
  IconButton,
  Tooltip,
  Typography
} from '@material-ui/core';
import {
  AddCircle,
  CheckBox, CheckBoxOutlineBlank, IndeterminateCheckBox,
  Delete,
  ExpandMore,
  Star, StarBorder
} from '@material-ui/icons';
import withStyles from '@material-ui/styles/withStyles';

function Panel(props) {
  const { label, children, defaultExpanded, theme, classes } = props;
  const [hovered, setHovered] = useState(false);

  let saveButton, selectButton;
  if (props.onSave)
    saveButton = <Button
      icon={ <StarBorder /> }
      tooltip='Save'
      onClick={ props.onSave } />;
  else if (props.onUnsave)
    saveButton = <Button
      icon={ <Star /> }
      tooltip='Unsave'
      onClick={ props.onUnsave } />;

  if (props.disableSelect)
    selectButton = <Button
      icon={ <IndeterminateCheckBox color='disabled'/> }
      tooltip={ props.disableSelectMsg }
      disabled />;
  else if (props.onSelect)
    selectButton = <Button
      icon={ <CheckBoxOutlineBlank /> }
      tooltip='Select'
      onClick={ props.onSelect } />;
  else if (props.onUnselect)
    selectButton = <Button
      icon={ <CheckBox /> }
      tooltip='Unselect'
      onClick={ props.onUnselect } />;
  
  const deleteButton = <Button
    icon={ <Delete /> }
    tooltip='Delete'
    onClick={ props.onDelete } />;

  return (
    <ExpansionPanel
      onMouseOver={ () => {
        setHovered(true);
        props.onMouseOver();
      } }
      onMouseOut={ () => {
        setHovered(false);
        props.onMouseOut();
      } }
      { ...{ defaultExpanded } } >
      <ExpansionPanelSummary
        expandIcon={ <ExpandMore /> }
        classes={{
          root: classes.panelRoot,
          content: classes.panelContent,
          expandIcon: classes.panelExpandIcon,
          expanded: classes.panelExpanded
        }}
        style={{
          backgroundColor: hovered ? theme.palette.hover.light : undefined
        }}>
        { selectButton }
        { saveButton }
        { deleteButton }
        <Typography variant='body2'>{ label }</Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>{ children }</ExpansionPanelDetails>
    </ExpansionPanel>);
}
Panel = withStyles(theme => ({
  panelRoot: {
    minHeight: 0,
    '&$panelExpanded': {
      minHeight: 0
    }
  },
  panelContent: {
    alignItems: 'center',
    margin: '5px 0',
    '&$panelExpanded': {
      margin: '8px 0'
    }
  },
  panelExpandIcon: {
    padding: '5px 12px'
  },
  panelExpanded: {}
}), { withTheme: true })(Panel);

function Button(props) {
  const { icon, tooltip, disabled, onClick } = props;
  const iconButtonProps = {};
  if (disabled) {
    iconButtonProps.disableRipple = true;
    iconButtonProps.onClick = evt => {
      evt.stopPropagation();
    };
  } else {
    iconButtonProps.onClick = evt => {
      evt.stopPropagation();
      onClick();
    };
  }
  return (
    <Tooltip title={ tooltip }>
      <IconButton
        size='small'
        { ...iconButtonProps }>
        { icon }
      </IconButton>
    </Tooltip>);
}

export default Panel;
