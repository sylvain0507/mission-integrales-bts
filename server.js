const SITE_ORIGIN='https://mission-integrales-bts-volt-261118.sylvainbeq.chatgpt.site';
const ALLOWED=new Set([SITE_ORIGIN,'https://sylvain0507.github.io']);
const encoder=new TextEncoder();
const randomCode=(n=10)=>Array.from(crypto.getRandomValues(new Uint8Array(n)),x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(s))),x=>x.toString(16).padStart(2,'0')).join('')}
function fail(status,message){throw Object.assign(Error(message),{status})}
async function getObject(bucket,key){const obj=await bucket.get(key);return obj?{value:await obj.json(),etag:obj.etag}:null}
async function putObject(bucket,key,value,etag){const o=await bucket.put(key,JSON.stringify(value),{httpMetadata:{contentType:'application/json'},...(etag?{onlyIf:{etagMatches:etag}}:{})});if(!o)fail(409,'Une autre fenêtre a modifié cette partie. Revenez à l’accueil puis reconnectez-vous pour la reprendre.');}
async function listKeys(bucket,prefix){let out=[],cursor;do{const r=await bucket.list({prefix,cursor,limit:1000});out.push(...r.objects.map(o=>o.key));cursor=r.truncated?r.cursor:undefined;}while(cursor);return out}
async function objects(bucket,prefix){const keys=await listKeys(bucket,prefix);return (await Promise.all(keys.map(k=>getObject(bucket,k)))).filter(Boolean).map(x=>x.value)}
function teacherId(req){const id=req.headers.get('oai-authenticated-user-id');if(!id)fail(401,'Connectez-vous à l’espace enseignant.');return encodeURIComponent(id)}
async function ownedClass(req,env,code){const uid=teacherId(req),c=await getObject(env.BUCKET,'class/'+code);if(!c||c.value.owner!==uid)fail(404,'Classe introuvable ou accès refusé.');return c.value}
async function studentAuth(req,env){const auth=req.headers.get('Authorization')||'',m=/^Bearer ([A-F0-9]{8}):([A-F0-9]{20})$/.exec(auth);if(!m)fail(401,'Code de classe ou clé personnelle incorrect.');const code=m[1],h=await digest(m[2]),cred=await getObject(env.BUCKET,`credential/${code}/${h}`);if(!cred)fail(401,'Code de classe ou clé personnelle incorrect.');const c=await getObject(env.BUCKET,'class/'+code);if(!c)fail(401,'Cette classe n’existe plus.');const key=`student/${code}/${cred.value.id}`,st=await getObject(env.BUCKET,key);if(!st)fail(401,'Accès élève introuvable.');return{...st,key,className:c.value.name};}
function studentView(a){const {id,name,sessions}=a.value;return{id,name,sessions,className:a.className}}
async function handleAPI(req,env){const path=new URL(req.url).pathname,method=req.method;if(!env.BUCKET)fail(503,'Le stockage de suivi n’est pas encore disponible.');
if(path==='/api/me'&&method==='GET')return{signedIn:!!req.headers.get('oai-authenticated-user-id'),email:req.headers.get('oai-authenticated-user-email')||''};
let body=null;if(method==='POST'){if(Number(req.headers.get('Content-Length')||0)>20000)fail(413,'Envoi trop volumineux.');const text=await req.text();if(text.length>20000)fail(413,'Envoi trop volumineux.');try{body=JSON.parse(text)}catch{fail(400,'Données invalides.')}}
if(path==='/api/classes'){
 const owner=teacherId(req);if(method==='GET')return objects(env.BUCKET,`teacher/${owner}/`);
 if(method==='POST'){const name=String(body.name||'').trim().slice(0,80);if(!name)fail(400,'Indiquez le nom de la classe.');const existing=await listKeys(env.BUCKET,`teacher/${owner}/`);if(existing.length>=30)fail(400,'Limite de 30 classes atteinte.');const code=randomCode(4),c={code,name,owner,created:new Date().toISOString()};await putObject(env.BUCKET,'class/'+code,c);await putObject(env.BUCKET,`teacher/${owner}/${code}`,{code,name});return{code,name};}
}
const route=/^\/api\/class\/([A-F0-9]{8})(?:\/(students|delete))?$/.exec(path);
if(route){const code=route[1],c=await ownedClass(req,env,code);
 if(method==='GET'&&!route[2])return{code,name:c.name,students:await objects(env.BUCKET,`student/${code}/`)};
 if(method==='POST'&&route[2]==='students'){if(!Array.isArray(body.names)||!body.names.length||body.names.length>60)fail(400,'Saisissez entre 1 et 60 identifiants.');const current=await objects(env.BUCKET,`student/${code}/`);if(current.length+body.names.length>200)fail(400,'Limite de 200 élèves par classe.');const names=body.names.map(n=>String(n).trim().slice(0,60));if(names.some(n=>!n)||new Set(names).size!==names.length||names.some(n=>current.some(s=>s.name===n)))fail(400,'Les identifiants doivent être non vides et différents dans cette classe.');for(const name of names){const id=crypto.randomUUID(),key=randomCode(10),st={id,name,key,sessions:[]};await putObject(env.BUCKET,`student/${code}/${id}`,st);await putObject(env.BUCKET,`credential/${code}/${await digest(key)}`,{id})}return{ok:true};}
 if(method==='POST'&&route[2]==='delete'){if(body.confirm!==code)fail(400,'Retapez le code de classe pour confirmer.');const keys=[...await listKeys(env.BUCKET,`student/${code}/`),...await listKeys(env.BUCKET,`credential/${code}/`)];await env.BUCKET.delete('class/'+code);for(let i=0;i<keys.length;i+=500)await env.BUCKET.delete(keys.slice(i,i+500));await env.BUCKET.delete(`teacher/${c.owner}/${code}`);return{ok:true}}
}
if(['/api/student','/api/start','/api/action'].includes(path)){
 const st=await studentAuth(req,env);
 if(path==='/api/student'&&method==='GET')return studentView(st);
 if(path==='/api/start'&&method==='POST'){if(![1,2].includes(body.level))fail(400,'Parcours invalide.');if(st.value.sessions.length>=50)fail(400,'Limite de 50 parties atteinte pour cet accès.');st.value.sessions.push(newSession(body.level,crypto.getRandomValues(new Uint32Array(1))[0],crypto.randomUUID()));await putObject(env.BUCKET,st.key,st.value,st.etag);return studentView(st)}
 if(path==='/api/action'&&method==='POST'){const s=st.value.sessions.find(s=>s.id===body.sessionId);if(!s)fail(404,'Partie introuvable.');if(!Number.isInteger(body.index)||body.index<0||body.index>5||body.index>progress(s))fail(400,'Mission non accessible.');s.index=body.index;try{act(s,body.action||{})}catch(e){fail(400,e.message)}await putObject(env.BUCKET,st.key,st.value,st.etag);return studentView(st)}
}
fail(404,'Page ou action introuvable.');}
const SECURITY={'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':'no-store','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
export default {async fetch(req,env){const url=new URL(req.url),origin=req.headers.get('Origin'),allowed=origin&&ALLOWED.has(origin),cors=allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Vary':'Origin'}:{};
if(req.method==='OPTIONS')return new Response(null,{status:allowed?204:403,headers:{...SECURITY,...cors}});
if(url.pathname==='/api/health')return Response.json({ok:true,storage:!!env.BUCKET},{headers:{...SECURITY,...cors}});
if(url.pathname.startsWith('/api/')){try{if(origin&&!allowed)fail(403,'Origine non autorisée.');if(req.method==='POST'&&!allowed)fail(403,'Origine requise pour modifier les données.');const data=await handleAPI(req,env);return Response.json(data,{headers:{...SECURITY,...cors}})}catch(e){return Response.json({error:e.status?e.message:'Le service de suivi rencontre une erreur. Réessayez.'},{status:e.status||500,headers:{...SECURITY,...cors}})}}
if(req.method!=='GET')return new Response('Méthode non autorisée',{status:405,headers:SECURITY});
if(url.pathname==='/robots.txt')return new Response('User-agent: *\nDisallow: /',{headers:{'Content-Type':'text/plain',...SECURITY}});
if(url.pathname==='/favicon.ico')return new Response(null,{status:204});
if(url.pathname!=='/'&&url.pathname!=='/index.html')return new Response('Page introuvable',{status:404,headers:SECURITY});
return new Response(APP_HTML,{headers:{'Content-Type':'text/html;charset=utf-8',...SECURITY}});
}};
