import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { buildEditedPdfFile } from '../src/services/pdf.service';

async function makeSourcePdf(pageCount: number) {
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) {
    const page = pdf.addPage([200, 300]);
    page.drawText(`Page ${index + 1}`, { x: 32, y: 260, size: 16 });
  }

  const bytes = await pdf.save();
  return new File([bytes], 'source.pdf', { type: 'application/pdf' });
}

const source = await makeSourcePdf(5);
const edited = await buildEditedPdfFile(source, [0, 2, 4], {
  filename: 'exam-final.pdf',
});
const editedDocument = await PDFDocument.load(await edited.arrayBuffer());

assert.equal(edited.name, 'exam-final.pdf');
assert.equal(edited.type, 'application/pdf');
assert.equal(editedDocument.getPageCount(), 3);

await assert.rejects(
  () => buildEditedPdfFile(source, [], { filename: 'empty.pdf' }),
  /at least one page/i,
);

console.log('PDF editor service verification passed');
