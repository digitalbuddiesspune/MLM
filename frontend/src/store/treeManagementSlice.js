import { createSlice } from '@reduxjs/toolkit';

const treeManagementSlice = createSlice({
  name: 'treeManagement',
  initialState: {
    selectedNodeId: null,
    highlightedSponsorId: null,
    manualMode: true,
    autoPlacementEnabled: false,
  },
  reducers: {
    selectNode(state, action) {
      state.selectedNodeId = action.payload ?? null;
    },
    highlightSponsor(state, action) {
      state.highlightedSponsorId = action.payload ?? null;
    },
    setManualMode(state, action) {
      state.manualMode = Boolean(action.payload);
    },
    setAutoPlacementEnabled(state, action) {
      state.autoPlacementEnabled = Boolean(action.payload);
    },
  },
});

export const {
  selectNode,
  highlightSponsor,
  setManualMode,
  setAutoPlacementEnabled,
} = treeManagementSlice.actions;

export default treeManagementSlice.reducer;
