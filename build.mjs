import fs from 'node:fs';
const engine=fs.readFileSync('engine.js','utf8');
const html=fs.readFileSync('app.html','utf8').replace('/*ENGINE*/',engine);
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
fs.writeFileSync('dist/server/index.js',engine+'\nconst APP_HTML='+JSON.stringify(html)+';\n'+fs.readFileSync('server.js','utf8'));
if(fs.existsSync('.openai/hosting.json'))fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
fs.writeFileSync('index.html',html);
console.log('HTML autonome et Worker générés.');
