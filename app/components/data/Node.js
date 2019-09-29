function Node(id, form) {
  return {
    group: 'nodes',
    data: {
      id,
      label: `${id}\n${form}`,
      form
    }
  };
}

export default Node;
