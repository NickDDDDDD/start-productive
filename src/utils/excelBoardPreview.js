function countMerge(currentItems, importedItems) {
  const currentIds = new Set(currentItems.map((item) => item.id));
  return importedItems.reduce(
    (summary, item) => {
      if (currentIds.has(item.id)) summary.updated += 1;
      else summary.created += 1;
      return summary;
    },
    { created: 0, updated: 0 },
  );
}

export function createImportPreview(currentState, importedState) {
  return {
    columns: countMerge(currentState.columns, importedState.columns),
    cards: countMerge(currentState.cards, importedState.cards),
    links: countMerge(currentState.links, importedState.links),
  };
}
