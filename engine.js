/* Pure Boolean algebra engine. No evaluation of user-provided JavaScript. */
(function(root){
'use strict';
const symbols={'!':'¬','~':'¬','&':'∧','*':'∧','·':'∧','|':'∨','^':'⊕','+':'⊕'};
function parse(input){
 if(input.length>400)throw Error('Формула слишком длинная. Максимум — 400 символов.');
 let source=input.toLowerCase().replace(/<->|<=>/g,'↔').replace(/->|=>/g,'→').replace(/&&/g,'∧').replace(/\|\|/g,'∨').replace(/\bxor\b/g,'⊕').replace(/\band\b/g,'∧').replace(/\bor\b/g,'∨').replace(/\bnot\b/g,'¬').replace(/[!~&*·|^+]/g,c=>symbols[c]).replace(/x_?([1-4])/g,(_,i)=>['x','y','z','w'][i-1]);
 let t=source.match(/[xyzw01()¬∧∨⊕→↔]|\S/g)||[],p=0;
 function atom(){let s=t[p++];if(s==='¬')return {op:'¬',a:atom()};if(s==='('){let a=eq();if(t[p++]!==')')throw Error('Не хватает закрывающей скобки.');return a;}if(/[xyzw01]/.test(s||'')&&s?.length===1)return {op:s};throw Error('Ожидалась переменная x, y, z, w, константа 0/1 или скобка.');}
 function chain(next,ops){let a=next();while(ops.includes(t[p])){let op=t[p++];a={op,a,b:next()};}return a;}
 function and(){return chain(atom,['∧']);}function xor(){return chain(and,['⊕']);}function or(){return chain(xor,['∨']);}
 function imp(){let a=or();if(t[p]==='→'){p++;return {op:'→',a,b:imp()};}return a;}
 function eq(){return chain(imp,['↔']);}
 let ast=eq();if(p!==t.length)throw Error('Лишний символ «'+t[p]+'». Между переменными нужен знак операции.');
 const used=new Set();(function visit(a){if('xyzw'.includes(a.op))used.add(a.op);if(a.a)visit(a.a);if(a.b)visit(a.b);})(ast);
 return {ast,vars:['x','y','z','w'].filter(x=>used.has(x))};
}
function evaluate(a,v){if(a.op==='0'||a.op==='1')return +a.op;if('xyzw'.includes(a.op))return v[a.op];let x=evaluate(a.a,v);if(a.op==='¬')return 1-x;let y=evaluate(a.b,v);return {'∧':x&y,'∨':x|y,'⊕':x^y,'→':(+(!x||y)),'↔':+(x===y)}[a.op];}
function label(a){if(!a.a)return a.op;if(a.op==='¬')return '¬'+(a.a.a?'('+label(a.a)+')':label(a.a));return '('+label(a.a)+' '+a.op+' '+label(a.b)+')';}
function term(mask,vars){return vars.filter((_,i)=>mask&(1<<(vars.length-1-i))).join('·')||'1';}
function coefficients(values){let a=values.slice();for(let b=1;b<a.length;b<<=1)for(let m=0;m<a.length;m++)if(m&b)a[m]^=a[m^b];return a;}
function analyze(values,vars){
 const n=values.length,co=coefficients(values),bits=i=>vars.length?i.toString(2).padStart(vars.length,'0'):'∅';
 let failS=null,failM=null;for(let i=0;i<Math.ceil(n/2);i++)if(values[i]===values[n-1-i]){failS=[i,n-1-i];break;}
 for(let i=0;i<n&&!failM;i++)for(let b=1;b<n;b<<=1)if(!(i&b)&&values[i]>values[i|b]){failM=[i,i|b];break;}
 let high=co.findIndex((a,m)=>a&&(m&(m-1))!==0);
 const classes={T0:values[0]===0,T1:values[n-1]===1,S:!failS,M:!failM,L:high===-1};
 const witnesses={T0:`f(${bits(0)}) = ${values[0]}`,T1:`f(${bits(n-1)}) = ${values[n-1]}`,S:failS?`Противоположные наборы ${bits(failS[0])} и ${bits(failS[1])}: оба значения равны ${values[failS[0]]}.`:`Во всех ${Math.ceil(n/2)} парах противоположных наборов значения различны.`,M:failM?`${bits(failM[0])} ≤ ${bits(failM[1])}, но f: 1 > 0.`:'На каждом переходе с заменой одного 0 на 1 значение не убывает.',L:high<0?'В полиноме есть только константа и/или одиночные переменные.':`Есть произведение ${term(high,vars)} степени ${term(high,vars).split('·').length}.`};
 const triangle=[values.slice()];while(triangle.at(-1).length>1){let a=triangle.at(-1);triangle.push(a.slice(1).map((x,i)=>x^a[i]));}
 return {values,vars,co,classes,witnesses,triangle,polynomial:co.map((a,i)=>a?term(i,vars):null).filter(x=>x).join(' ⊕ ')||'0',bits};
}
function solve(input){let {ast,vars}=parse(input);const nodes=[];(function visit(a){if(a.a)visit(a.a);if(a.b)visit(a.b);if(a.a&&!nodes.some(b=>label(b)===label(a)))nodes.push(a);})(ast);let rows=Array.from({length:2**vars.length},(_,i)=>{let env=Object.fromEntries(vars.map((v,k)=>[v,(i>>(vars.length-1-k))&1]));return {env,steps:nodes.map(a=>evaluate(a,env)),value:evaluate(ast,env)};});return {...analyze(rows.map(r=>r.value),vars),ast,nodes,rows,formula:label(ast)};}
const api={parse,evaluate,label,term,coefficients,analyze,solve};if(typeof module!=='undefined')module.exports=api;else root.BooleanLab=api;
})(typeof window!=='undefined'?window:globalThis);
