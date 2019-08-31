import React from 'react';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';

import IconButton from '@material-ui/core/IconButton';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import DeleteIcon from '@material-ui/icons/Delete';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import withStyles from '@material-ui/styles/withStyles';

function Panel(props) {
  const { label, children, defaultExpanded, classes } = props;
  let saveButton, selectButton;
  if (props.onSave)
    saveButton = <Button
      icon={ <StarBorderIcon /> }
      tooltip='Save'
      onClick={ props.onSave } />;
  else if (props.onUnsave)
    saveButton = <Button
      icon={ <StarIcon /> }
      tooltip='Unsave'
      onClick={ props.onUnsave } />;

  if (props.disableSelect)
    selectButton = <Button
      icon={ <IndeterminateCheckBoxIcon color='disabled'/> }
      tooltip={ props.disableSelectMsg }
      disabled />;
  else if (props.onSelect)
    selectButton = <Button
      icon={ <CheckBoxOutlineBlankIcon /> }
      tooltip='Select'
      onClick={ props.onSelect } />;
  else if (props.onUnselect)
    selectButton = <Button
      icon={ <CheckBoxIcon /> }
      tooltip='Unselect'
      onClick={ props.onUnselect } />;
  
  const deleteButton = <Button
    icon={ <DeleteIcon /> }
    tooltip='Delete'
    onClick={ props.onDelete } />;
  return (
    <ExpansionPanel
      onMouseOver={ () => props.onMouseOver() }
      onMouseOut={ () => props.onMouseOut() }
      { ...{ defaultExpanded } } >
      <ExpansionPanelSummary
        expandIcon={ <ExpandMoreIcon /> }
        classes={{
          root: classes.panelRoot,
          content: classes.panelContent,
          expandIcon: classes.panelExpandIcon,
          expanded: classes.panelExpanded
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
    '&:hover': { backgroundColor: theme.palette.hover.light },
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
}))(Panel);

function Button(props) {
  const { icon, tooltip, disabled, onClick } = props;
  const iconButtonProps = {};
  if (disabled) {
    iconButtonProps.disableRipple = true;
    iconButtonProps.onClick = evt => {
      evt.stopPropagation();
    };
  }
  else {
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
