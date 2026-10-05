export const rules = [
  {id:'last',title:'No following word',description:'This is the last word in the excerpt.',label:true},
  {id:'terminal',title:'Followed by ? or !',description:'The word ends in a question mark or exclamation mark.',label:true},
  {id:'abbreviation',title:'Is an abbreviation',description:'An exception: stop and predict not EOS.',label:false},
  {id:'period',title:'Followed by a period',description:'The word ends in a full stop.',label:true}
];
export const slideOrder=['last','terminal','abbreviation','period'];
export const abbreviations=['Dr.','Mr.','Mrs.','Ms.','Prof.','etc.','e.g.','i.e.','U.S.'];
const known=new Set(abbreviations.map(s=>s.toLowerCase()));
export const datasets=[
 {id:'slides',name:'Examples from the slides',note:'Each numbered excerpt is a separate input. “No following word” means the last word of that excerpt, not the last word of every sentence.',lines:[
  'The instructions were simple: read the chapter, answer the questions, and submit the assignment. |',
  'Did you finish the homework? |',
  'I like pizza! |',
  'Dr. Smith arrived early. |',
  'She packed snacks, water, sunscreen, etc. for the trip. |',
  'You should bring the usual supplies: pencils, paper, markers, etc. |'
 ]},
 {id:'challenge',name:'Challenge: several sentences in one excerpt',note:'The same rules now see multiple sentences per excerpt. Look for abbreviations that also end sentences. Reference boundaries are supplied for these examples.',lines:[
  'Dr. Lee arrived. | Did you see her? | I waved! |',
  'Bring paper, pencils, etc. | We start now. |',
  'She asked, “Ready?” | We nodded. |',
  'The value is 3.14 today. |',
  'They moved to the U.S. | She stayed in Canada. |',
  'Because I was'
 ]}
];
// Whitespace-delimited words retain punctuation. Pipes provide gold boundaries only.
export function parseExcerpt(marked){
 const parts=marked.match(/\||[^\s|]+/gu)||[],tokens=[];
 for(const part of parts){
  if(part==='|'){if(!tokens.length)throw new Error('Place a boundary marker after a word.');tokens.at(-1).gold=true;}
  else tokens.push({text:part,gold:false});
 }
 return tokens.map((t,i)=>{
  const clean=t.text.replace(/[”’"')\]}]+$/gu,'').replace(/^[“‘"'(\[{]+/gu,'');
  return {...t,index:i,features:{last:i===tokens.length-1,terminal:/[?!]$/u.test(clean),abbreviation:known.has(clean.toLowerCase()),period:/\.$/u.test(clean)}};
 });
}
export function predict(token,order){
 const trace=[];let fired=null;
 for(const id of order){const rule=rules.find(r=>r.id===id);if(!rule)throw new Error('Unknown rule: '+id);const matches=Boolean(token.features[id]);trace.push({id,matches,reached:fired===null});if(fired===null&&matches)fired=rule;}
 return {label:fired?.label??false,rule:fired?.id??null,trace};
}
export function classify(lines,order){return lines.map(line=>parseExcerpt(line).map(token=>{const prediction=predict(token,order);return {...token,prediction,status:prediction.label?(token.gold?'tp':'fp'):(token.gold?'fn':'tn')};}));}
export function metrics(excerpts){const counts={tp:0,fp:0,fn:0,tn:0};for(const token of excerpts.flat())counts[token.status]++;return {...counts,precision:counts.tp+counts.fp?counts.tp/(counts.tp+counts.fp):null,recall:counts.tp+counts.fn?counts.tp/(counts.tp+counts.fn):null};}
