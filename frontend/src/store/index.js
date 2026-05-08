import { configureStore } from '@reduxjs/toolkit';
import treeManagementReducer from './treeManagementSlice.js';

export const store = configureStore({
  reducer: {
    treeManagement: treeManagementReducer,
  },
});
