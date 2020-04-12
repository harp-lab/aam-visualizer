import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';

function PanelTable(props) {
  const labels = props.labels
    .map(label => <TableCell key={ label }>{ label }</TableCell>);
  const entries = props.entries
    .map((entry, row) => {
      const fields = entry.map((field, cell) => <TableCell key={ cell }>{ field }</TableCell>);
      return <TableRow key={ row }>{ fields }</TableRow>;
    });
  return (
      <Table size='small'>
        <TableHead>
          <TableRow>{ labels }</TableRow>
        </TableHead>
        <TableBody>{ entries }</TableBody>
      </Table>);
}

export default PanelTable;
