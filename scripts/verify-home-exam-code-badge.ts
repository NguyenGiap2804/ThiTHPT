import assert from 'node:assert/strict';
import { getExamCodeBadgeLabel } from '../src/services/exam-card.service';

assert.equal(getExamCodeBadgeLabel('101'), 'Mã đề 101');
assert.equal(getExamCodeBadgeLabel(' 0118 '), 'Mã đề 0118');
assert.equal(getExamCodeBadgeLabel(''), null);
assert.equal(getExamCodeBadgeLabel('   '), null);
assert.equal(getExamCodeBadgeLabel(undefined), null);

console.log('Home exam code badge verification passed');
