import React, { useState } from 'react';
import { connect } from 'react-redux';
import { selectPanel, unselectPanel, savePanel, unsavePanel, hidePanel } from '../redux/actions/panels';
import { getPanels } from '../redux/selectors/panels';

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
    panelId, panelType, panelData, children, theme, classes,
    selectPanel, unselectPanel, savePanel, unsavePanel, hidePanel
  } = props;
  const [hovered, setHovered] = useState(false);

  function select() {
    selectPanel(panelType, panelId);
    if (props.onSelect) props.onSelect();
  }
  function unselect() {
    unselectPanel(panelType, panelId);
    if (props.onUnselect) props.onUnselect();
  }
  const save = () => savePanel(panelType, panelId);
  const unsave = () => unsavePanel(panelType, panelId);
  const hide = () => hidePanel(panelType, panelId);

  const { selected, saved } = panelData;
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
        setHovered(true);
        props.onMouseOver();
      } }
      onMouseOut={ () => {
        setHovered(false);
        props.onMouseOut();
      } }
      defaultExpanded={ !panelData.saved }>
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
        <Typography>{ panelData.label }</Typography>
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
const mapStateToProps = (state, ownProps) => {
  const { panelId, panelType } = ownProps;
  const panelData = getPanels(state)[panelType][panelId];
  return { panelData };
};
export default connect(
  mapStateToProps,
  { selectPanel, unselectPanel, savePanel, unsavePanel, hidePanel }
)(Panel);

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
