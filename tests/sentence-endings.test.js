import test from 'node:test';
import assert from 'node:assert/strict';
import {parseExcerpt,classify,metrics,datasets,slideOrder} from '../modules/sentence-endings/model.js';
const slideLines=datasets[0].lines;
test('slide-order classifier handles all six lecture excerpts',()=>{
 const m=metrics(classify(slideLines,slideOrder));assert.equal(m.tp,6);assert.equal(m.fp,0);assert.equal(m.fn,0);
});
test('period-only rule produces abbreviation false alarms and misses ? and !',()=>{
 const m=metrics(classify(slideLines,['period']));assert.equal(m.tp,4);assert.equal(m.fp,2);assert.equal(m.fn,2);
});
test('abbreviation veto and last-word EOS rule compete in execution order',()=>{
 const a=classify(['Bring pens, etc. |'],['abbreviation','last','period'])[0].at(-1);
 const b=classify(['Bring pens, etc. |'],['last','abbreviation','period'])[0].at(-1);
 assert.equal(a.status,'fn');assert.equal(b.status,'tp');assert.equal(b.prediction.trace[1].reached,false);
});
test('abbreviation-first fixes Dr. but period-first makes it a false alarm',()=>{
 assert.equal(classify(['Dr. Lee came. |'],['period','abbreviation'])[0][0].status,'fp');
 assert.equal(classify(['Dr. Lee came. |'],['abbreviation','period'])[0][0].status,'tn');
});
test('removing all rules applies the not-EOS default without inventing precision',()=>{
 const m=metrics(classify(slideLines,[]));assert.equal(m.tp,0);assert.equal(m.fn,6);assert.equal(m.precision,null);assert.equal(m.recall,0);
});
test('gold labels never enter prediction features',()=>{
 const a=classify(['She left. | We stayed. |'],slideOrder)[0];
 const b=classify(['She | left. We | stayed.'],slideOrder)[0];
 assert.deepEqual(a.map(t=>t.prediction),b.map(t=>t.prediction));assert.deepEqual(a.map(t=>t.features),b.map(t=>t.features));
});
test('closing quotations, terminal periods and decimal numbers remain distinct',()=>{
 assert.equal(parseExcerpt('“Ready?” |')[0].features.terminal,true);
 assert.equal(parseExcerpt('3.14 is pi. |')[0].features.period,false);
 assert.equal(parseExcerpt('U.S.')[0].features.abbreviation,true);
});
test('challenge data exposes sentence-final abbreviations and truncated input',()=>{
 const r=classify(datasets[1].lines,slideOrder).flat();
 assert(r.some(t=>t.text==='etc.'&&t.status==='fn'));
 assert(r.some(t=>t.text==='U.S.'&&t.status==='fn'));
 assert(r.some(t=>t.text==='was'&&t.status==='fp'));
});
test('custom labels preserve adjacent markers and reject a leading marker',()=>{
 assert.equal(parseExcerpt('Done.| Next. |').filter(t=>t.gold).length,2);
 assert.throws(()=>parseExcerpt('| word'));
 assert.equal(metrics(classify(['unfinished fragment'],[])).recall,null);
});
