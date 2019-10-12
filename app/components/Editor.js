import React, { Fragment, useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { saveCode, processCode } from 'store-apis';
import { getSelectedProjectId, getProjectData } from 'store-selectors';

import { Button, InputLabel, MenuItem, Select, Toolbar, Typography } from '@material-ui/core';
import codemirror from 'codemirror/lib/codemirror';
import 'codemirror/mode/scheme/scheme';

function Editor(props) {
  const { edit, processOptions, error, errorContent } = props;
  const { analysis } = processOptions;

  const cmElem = useRef(undefined);
  const cmConfig = {
    lineWrapping: true,
    lineNumbers: true,
    readOnly: (!edit)
  };
  const cmRef = useRef(codemirror);

  const [options, setOptions] = useState({ analysis: analysis[0] });
  const projectId = useSelector(getSelectedProjectId);
  const { code } = useSelector(getProjectData);
  const dispatch = useDispatch();

  function setValue(data) { cmRef.current.getDoc().setValue(data); }
  function getValue() { return cmRef.current.getDoc().getValue(); }
  function save() { dispatch(saveCode(projectId, getValue())); }
  function process() { dispatch(processCode(projectId, getValue(), options)); }

  useEffect(() => {
    cmRef.current = codemirror.fromTextArea(cmElem.current, cmConfig);

    return () => {
      cmRef.current.toTextArea();
      save();
    };
  }, []);
  useEffect(() => {
    setValue(code);
  }, [code]);
  
  let infoElement;
  let editMenu;
  if (edit) {
    infoElement = <Typography>Input code for analysis</Typography>;

    const analysisOptions = processOptions.analysis;
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
