import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const maths=vm.createContext({});vm.runInContext(fs.readFileSync('math.js','utf8')+';globalThis.render=mathNotation;',maths);
for(const script of fs.readFileSync('index.html','utf8').matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
const exp=maths.render('i(t) = 3e^(−t/2) A.');assert.ok(exp.includes('<msup>')&&exp.includes('<mfrac>'));assert.ok(!exp.includes('^('));
const integ=maths.render('Q = ∫ de 0 à 4 de i(t) dt.');assert.ok(integ.includes('<msubsup><mo>∫</mo>'));assert.ok(!integ.includes('∫ de'));
assert.ok(maths.render('I_eff = √[(1/T) ∫ de 0 à T de i²(t) dt]').includes('<msqrt>'));
assert.ok(!maths.render('<img src=x onerror=alert(1)>').includes('<img'));
console.log('Notation mathématique : exposants, fractions, intégrales, racines et scripts du navigateur vérifiés.');
const c=vm.createContext({console,Date,Math});vm.runInContext(fs.readFileSync('engine.js','utf8')+';globalThis.E={missions,newSession,act,mark,progress,numberInput,missionScore};',c);const E=c.E;
function simpson(f,a,b,n=2000){let h=(b-a)/n,sum=f(a)+f(b);for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+i*h);return sum*h/3}
let count=0;for(const level of [1,2])for(let seed=0;seed<100;seed++){const ms=E.missions(level,seed);assert.equal(ms.length,6);for(let i=0;i<6;i++){const m=ms[i],s=m.shape;assert.ok(Number.isFinite(m.answer));if(level===1&&i===0)assert.equal(m.answer,s.a/2);if(level===1&&[2,3,4].includes(i)){let z=simpson(t=>s.a*t+s.b,0,s.T);if(i===4)z/=s.T;assert.ok(Math.abs(m.answer-z)<1e-7)}if(level===1&&i===5)assert.equal(m.answer,2*s.a+3*s.b);if(level===2&&i===0)assert.equal(m.answer,-s.a*s.tau);if(level===2&&i===1)assert.ok(Math.abs(m.answer-simpson(t=>s.a*Math.exp(-t/s.tau),0,s.T))<1e-7);if(level===2&&i===2)assert.ok(Math.abs(m.answer-simpson(t=>s.a/(t+1),0,s.T))<1e-7);if(level===2&&i===3)assert.ok(Math.abs(m.answer-simpson(t=>s.a*Math.sin(s.w*t),0,s.T))<1e-7);if(level===2&&i===4)assert.ok(Math.abs(m.answer-Math.sqrt(simpson(t=>(s.a*Math.sin(s.w*t))**2,0,s.T)/s.T))<1e-7);if(level===2&&i===5){const C=Number(m.context.match(/C = (\d+)/)[1])/1000;const z=simpson(t=>s.a*(1-Math.exp(-t/s.tau))*C*s.a/s.tau*Math.exp(-t/s.tau),0,s.T);assert.ok(Math.abs(m.answer-z)<1e-7)}count++;}
 const st=E.newSession(level,seed,'test');for(let i=0;i<6;i++){st.index=i;E.act(st,{type:'answer',value:String(ms[i].answer),choice:0})}assert.equal(E.mark(st),20);assert.equal(E.progress(st),6);
}
assert.equal(E.numberInput('1,25'),1.25);assert.equal(E.numberInput('1e-3'),.001);assert.ok(Number.isNaN(E.numberInput('1/2')));assert.ok(Number.isNaN(E.numberInput('')));
let s=E.newSession(1,42,'score');E.act(s,{type:'hint'});E.act(s,{type:'answer',value:'-999',choice:1});E.act(s,{type:'answer',value:String(E.missions(1,42)[0].answer),choice:0});assert.equal(E.missionScore(s.records[0]),7);s.index=1;E.act(s,{type:'reveal'});assert.equal(E.missionScore(s.records[1]),0);assert.throws(()=>E.act(s,{type:'answer',value:'2',choice:0}));
console.log(`${count} missions générées : calculs vérifiés, notes et progression vérifiées.`);
class Bucket{map=new Map();v=0;async get(k){const o=this.map.get(k);return o?{etag:o.etag,json:async()=>JSON.parse(o.s)}:null}async put(k,s,opt={}){if(opt.onlyIf&&this.map.get(k)?.etag!==opt.onlyIf.etagMatches)return null;const o={s,etag:String(++this.v)};this.map.set(k,o);return o}async list({prefix}){return{objects:[...this.map.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false}}async delete(k){for(const x of Array.isArray(k)?k:[k])this.map.delete(x)}}
const worker=(await import('./dist/server/index.js?test='+Date.now())).default,env={BUCKET:new Bucket()},origin='https://mission-integrales-bts-volt-261118.sylvainbeq.chatgpt.site';
async function req(path,body,{user,key,code,originOverride}={}){const headers={Origin:originOverride||origin};if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']=user+'@example.test'}if(key)headers.Authorization='Bearer '+code+':'+key;const r=await worker.fetch(new Request(origin+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined}),env);return{status:r.status,data:await r.json()}}
assert.equal((await req('/api/classes')).status,401);const cc=await req('/api/classes',{name:'Test BTS'},{user:'teacher-a'});assert.equal(cc.status,200);const code=cc.data.code;assert.equal((await req('/api/class/'+code,null,{user:'teacher-b'})).status,404);assert.equal((await req('/api/class/'+code,null,{code,key:'00000000000000000000'})).status,401);
assert.equal((await req('/api/class/'+code+'/students',{names:['E01','E02']},{user:'teacher-a'})).status,200);const cl=(await req('/api/class/'+code,null,{user:'teacher-a'})).data;const auth={code,key:cl.students[0].key};assert.equal((await req('/api/student',null,{code,key:'00000000000000000000'})).status,401);assert.equal((await req('/api/student',null,auth)).data.name,'E01');assert.equal((await req('/api/start',{level:1},{...auth,originOverride:'https://evil.invalid'})).status,403);
const st=(await req('/api/start',{level:1},auth)).data.sessions[0];assert.equal((await req('/api/action',{sessionId:st.id,index:5,action:{type:'reveal'}},auth)).status,400);for(let i=0;i<6;i++){const m=E.missions(1,st.seed)[i];assert.equal((await req('/api/action',{sessionId:st.id,index:i,action:{type:'answer',value:String(m.answer),choice:0}},auth)).status,200)}const result=(await req('/api/student',null,auth)).data;assert.equal(E.mark(result.sessions[0]),20);assert.equal((await req('/api/student',null,{code,key:cl.students[1].key})).data.sessions.length,0);assert.ok(!('key' in result));
// Clés courtes : format lisible et saisie tolérante.
for(const st of cl.students){assert.match(st.key,/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);assert.ok(!/[01ILO]/.test(st.key))}
assert.equal((await req('/api/student',null,{code,key:auth.key.toLowerCase().replace('-',' ')})).data.name,'E01');
assert.equal((await req('/api/student',null,{code,key:auth.key.replace('-','')})).data.name,'E01');
assert.equal((await req('/api/class/'+code+'/simplify-keys',{}, {user:'teacher-b'})).status,404);
assert.equal((await req('/api/class/'+code+'/simplify-keys',{}, auth)).status,401);
// Ancien accès simulé : simplification sans perte de parties ni coupure de connexion.
const legacy='ABCDEF0123456789ABCD',legacyPath=`student/${code}/${cl.students[0].id}`;
const stored=await (await env.BUCKET.get(legacyPath)).json();stored.key=legacy;
await env.BUCKET.put(legacyPath,JSON.stringify(stored));
const oldHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(legacy))),x=>x.toString(16).padStart(2,'0')).join('');
await env.BUCKET.put(`credential/${code}/${oldHash}`,JSON.stringify({id:stored.id}));
assert.equal((await req('/api/student',null,{code,key:legacy})).data.name,'E01');
assert.equal((await req('/api/class/'+code+'/simplify-keys',{}, {user:'teacher-a'})).data.changed,1);
const migrated=(await req('/api/class/'+code,null,{user:'teacher-a'})).data.students.find(s=>s.id===stored.id);
assert.match(migrated.key,/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
assert.equal(E.mark((await req('/api/student',null,{code,key:migrated.key})).data.sessions[0]),20);
assert.equal(E.mark((await req('/api/student',null,{code,key:legacy})).data.sessions[0]),20);
assert.equal((await req('/api/class/'+code+'/simplify-keys',{}, {user:'teacher-a'})).data.changed,0);
console.log('Clés courtes : format, saisie souple, migration et conservation des notes vérifiés.');
assert.equal((await req('/api/class/'+code+'/delete',{confirm:code},{user:'teacher-a'})).status,200);assert.equal((await req('/api/student',null,auth)).status,401);assert.equal(env.BUCKET.map.size,0);console.log('API : isolation enseignants/élèves, notes serveur, progression, CORS et suppression vérifiés.');
