import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectPanel, unselectPanel, savePanel, unsavePanel, hidePanel } from 'store-actions';
import { getPanels } from 'store-selectors';

import {
  ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails,
  IconButton,
  Tooltip,
  Typography
} from '@material-ui/core';
import {
  CheckBox, CheckBoxOutlineBlank, IndeterminateCheckBox,
  Delete,
  ExpandMore,
  Star, StarBorder
} from '@material-ui/icons';
import withStyles from '@material-ui/styles/withStyles';

function Panel(props) {
  const {
    panelId, panelType, children, theme, classes,
    onSelect, onUnselect, onMouseOver, onMouseOut
  } = props; 
  const panelData = useSelector(getPanels)[panelType][panelId];
  const dispatch = useDispatch();
  const [hovered, setHovered] = useState(false);

  function select() {
    dispatch(selectPanel(panelType, panelId));
    if (onSelect) onSelect();
  }
  function unselect() {
    dispatch(unselectPanel(panelType, panelId));
    if (onUnselect) onUnselect();
  }
  const save = () => dispatch(savePanel(panelType, panelId));
  const unsave = () => dispatch(unsavePanel(panelType, panelId));
  const hide = () => dispatch(hidePanel(panelType, panelId));

  const { label, selected, saved } = panelData;
  let saveButton, selectButton;
  if (props.disableSelect)
    selectButton = <Button
      icon={ <IndeterminateCheckBox color='disabled'/> }
      tooltip={ props.disableSelectMsg }
      disabled />;
  else if (!selected)
    selectButton = <Button
      icon={ <CheckBoxOutlineBlank /> }
      tooltip='Select'
      onClick={ select } />;
  else
    selectButton = <Button
      icon={ <CheckBox /> }
      tooltip='Unselect'
      onClick={ unselect } />;
  
  if (!saved)
    saveButton = <Button
      icon={ <StarBorder /> }
      tooltip='Save'
      onClick={ save } />;
  else
    saveButton = <Button
      icon={ <Star /> }
      tooltip='Unsave'
      onClick={ unsave } />;

  const deleteButton = <Button
    icon={ <Delete /> }
    tooltip='Delete'
    onClick={ hide } />;

  return (
    <ExpansionPanel
      onMouseOver={ () => {
        if (!hovered) {
          onMouseOver();
          setHovered(true);
        }
      }}
      onMouseOut={ () => {
        if (hovered) {
          onMouseOut();
          setHovered(false);
        }
      }}
      defaultExpanded={ !saved }>
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
        <Typography>{ label }</Typography>
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
