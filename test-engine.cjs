const assert=require('node:assert/strict');
const B=require('./engine.js');
const expected=[['x ∨ y','0111','0111',{T0:true,T1:true,S:false,M:true,L:false}],['x → y','1101','1011',{T0:false,T1:true,S:false,M:false,L:false}],['¬(x ∧ y)','1110','1001',{T0:false,T1:false,S:false,M:false,L:false}],['x ⊕ y ⊕ z','01101001','01101000',{T0:true,T1:true,S:true,M:false,L:true}],['(x → y) ⊕ z','10100110','11001010',{T0:false,T1:false,S:false,M:false,L:false}]];
for(const [expr,vec,co,cl] of expected){const r=B.solve(expr);assert.equal(r.values.join(''),vec,expr);assert.equal(r.co.join(''),co,expr);assert.deepEqual(r.classes,cl,expr);}
// Exhaust every 3-input Boolean function, independently check polynomial,
// all comparable pairs for monotonicity, complement pairs, and the triangle.
for(let code=0;code<256;code++){
 const values=Array.from({length:8},(_,i)=>(code>>i)&1),r=B.analyze(values,['x','y','z']);
 for(let i=0;i<8;i++){let v=0;for(let m=0;m<8;m++)if((m&i)===m)v^=r.co[m];assert.equal(v,values[i]);}
 assert.deepEqual(r.triangle.map(a=>a[0]),r.co);
 let mono=true,self=true;for(let i=0;i<8;i++){if(values[i]===values[7-i])self=false;for(let j=0;j<8;j++)if((i&j)===i&&values[i]>values[j])mono=false;}
 assert.equal(r.classes.M,mono);assert.equal(r.classes.S,self);
}
for(const input of ['','xy','x +','x) ∨ y','(x ∨ y','alert(1)','x5','x / y'])assert.throws(()=>B.solve(input),input);
assert.equal(B.solve('x1 -> x2').values.join(''),'1101');
assert.equal(B.solve('!(x & y)').values.join(''),'1110');
assert.equal(B.solve('x -> y -> z').values.join(''),B.solve('x -> (y -> z)').values.join(''));
assert.deepEqual(B.solve('0').classes,{T0:true,T1:false,S:false,M:true,L:true});
assert.deepEqual(B.solve('1').classes,{T0:false,T1:true,S:false,M:true,L:true});
console.log('Passed: examples, parser, constants, all 256 three-variable functions.');

