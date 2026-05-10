import assert from 'node:assert/strict';
import {
  createEmptyPdfPageSelection,
  initializePdfPageSelection,
} from '../src/services/pdf-page-selection.service';

let state = createEmptyPdfPageSelection();
state = initializePdfPageSelection(state, 12);
assert.deepEqual([...state.keptPages], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

state = {
  ...state,
  keptPages: new Set([1, 2, 3, 4, 5, 6, 7, 8]),
};
state = initializePdfPageSelection(state, 12);
assert.deepEqual([...state.keptPages], [1, 2, 3, 4, 5, 6, 7, 8]);

state = {
  ...state,
  keptPages: new Set(),
};
state = initializePdfPageSelection(state, 12);
assert.equal(state.keptPages.size, 0);

state = createEmptyPdfPageSelection();
state = initializePdfPageSelection(state, 8);
assert.deepEqual([...state.keptPages], [1, 2, 3, 4, 5, 6, 7, 8]);

console.log('PDF editor state verification passed');
