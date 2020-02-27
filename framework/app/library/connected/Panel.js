import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails,
  IconButton, Tooltip, Typography
} from '@material-ui/core';
import {
  CheckBox, CheckBoxOutlineBlank, IndeterminateCheckBox,
  Delete, ExpandMore, Star, StarBorder
} from '@material-ui/icons';
import { withStyles } from '@material-ui/styles';
import { selectPanel, unselectPanel, savePanel, unsavePanel, hidePanel } from 'store/actions';
import { getPanels } from 'store/selectors';

/**
 * @param {Object} props 
 * @param {String} props.panelId panel id
 * @param {String} props.panelType panel type
 * @param {Function} props.onSelect panel select callback
 * @param {Function} props.onUnselect panel unselect callback
 * @param {Function} props.onMouseOver panel mouseover callback
 * @param {Function} props.onMouseOut panel mouseout callback
 * @param {ReactElement} props.children
 * @param {Object} props.theme
 * @param {Object} props.classes
 */
function Panel(props) {
  const {
    panelId, panelType,
    onSelect, onUnselect, onMouseOver, onMouseOut,
    children, theme, classes
  } = props; 
  const panelData = useSelector(state => getPanels(state, panelType))[panelId];
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
