import React, { Fragment, useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, InputLabel, MenuItem, Select, Toolbar, Typography } from '@material-ui/core';
import { saveAnalysisInput, processAnalysisInput } from 'store/apis';
import { EMPTY_STATUS, EDIT_STATUS } from 'store/consts';
import { getSelectedProjectId, getProject, getProjectServerStatus } from 'store/selectors';

import codemirror from 'codemirror/lib/codemirror';
import 'codemirror/mode/scheme/scheme';

function Editor(props) {
  const { edit, error } = props;
  const analysis = ['0-cfa', '1-cfa', '2-cfa'];

  const cmElem = useRef(undefined);
  const cmConfig = {
    lineWrapping: true,
    lineNumbers: true,
    readOnly: (!edit)
  };
  const cmRef = useRef(codemirror);

  const [options, setOptions] = useState({ analysis: analysis[0] });
  const projectId = useSelector(getSelectedProjectId);
  const { analysisInput: code, error: errorContent } = useSelector(getProject);
  const dispatch = useDispatch();


  function setValue(data) { cmRef.current.getDoc().setValue(data); }
  function getValue() { return cmRef.current.getDoc().getValue(); }
  function process() { dispatch(processAnalysisInput(projectId, getValue(), options)); }

  useEffect(() => {
    cmRef.current = codemirror.fromTextArea(cmElem.current, cmConfig);

    return () => {
      cmRef.current.toTextArea();

      dispatch(save(projectId, getValue()));
    };
  }, []);
  useEffect(() => {
    setValue(code);
  }, [code]);
  
  let infoElement;
  let editMenu;
  if (edit) {
    infoElement = <Typography>Input code for analysis</Typography>;

    const analysisOptions = analysis;
    const analysisMenuItems = analysisOptions.map(option => {
      return (
        <MenuItem
          key={ option }
          value={ option }>
          { option }
        </MenuItem>);
    });
    editMenu = (
      <Toolbar>
        <div style={{ flex: '1 1 auto' }}>
          <InputLabel>Analysis</InputLabel>
          <Select
            value={ options.analysis }
            onChange={ evt => {
              const analysis = evt.target.value;
              setOptions({ ...options, analysis });
            }}>
            { analysisMenuItems }
          </Select>
        </div>
        <ProcessButton onClick={ process }/>
      </Toolbar>
    );
  } else if (error) {
    infoElement = (
      <Fragment>
        <Typography
          variant='h3'>
          Analysis error
        </Typography>
        <Typography>
          { errorContent }
        </Typography>
      </Fragment>
    );
  }

  return (
    <div
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto'
      }}>
      { infoElement }
      <textarea
        ref={ ref => cmElem.current = ref }
        style={{
          flex: '1 1 auto',
          overflow: 'auto',
          height: '100%'
        }} />
      { editMenu }
    </div>
  );
}

/**
 * @param {String} projectId project id
 * @param {String} code 
 * @returns {Function} dispatch
 */
function save(projectId, code) {
  return function(dispatch, getState) {
    const state = getState();
    const serverStatus = getProjectServerStatus(state, projectId);
    
    switch (serverStatus) {
      case EMPTY_STATUS:
      case EDIT_STATUS:
        dispatch(saveAnalysisInput(projectId, code));
        break;
      default:
        break;
    }
  };
}

function ProcessButton(props) {
  const { onClick } = props;
  return (
  <Button
    onClick={ onClick }
    variant='contained'
    color='secondary'>
    process
  </Button>);
}

export default Editor;
