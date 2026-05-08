import { createContext, useContext } from 'react';

export const BinaryTreeUiContext = createContext({
  toggleCollapseId: (_id) => {},
  collapseHas: (_id) => false,
  setSubtreeAnchor: (_id) => {},
});

export function useBinaryTreeUi() {
  return useContext(BinaryTreeUiContext);
}
