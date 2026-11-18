const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('/home/tuor4eg/pets/proletarka/node_modules/typescript');
const assert = require('node:assert/strict');
const root = '/home/tuor4eg/pets/proletarka';
function load(file, deps, globals = {}) {
 const js = ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 const sandbox={module,exports:module.exports,require:(id)=>{if(!(id in deps)) throw new Error('Unapproved dependency '+id);return deps[id];},TextEncoder,console,process:{env:{}},...globals};
 vm.runInNewContext(js,sandbox,{filename:file});return module.exports;
}
(async()=>{
 const jose=await import(root+'/node_modules/jose/dist/webapi/index.js');
 let jar;
 const store={get:()=>jar?{value:jar}:undefined,set:(_n,v)=>{jar=v},delete:()=>{jar=undefined}};
 const session=load('src/lib/session.ts',{'jose':jose,'next/headers':{cookies:async()=>store}}, {process:{env:{SESSION_SECRET:'isolated-audit-fixture-secret-not-production',SECURE_COOKIES:'true'}}});
 await session.createSession({userId:987654,role:'admin'});
 const copiedToken=jar;
 assert.equal((await session.getSession()).userId,987654);
 await session.deleteSession();assert.equal(await session.getSession(),null);
 jar=copiedToken;assert.equal((await session.getSession()).userId,987654);
 console.log('PASS: copied fixture JWT is still accepted after deleteSession; no production token used.');
 const schema={};for(const name of ['materials','people','personMaterials'])schema[name]=new Proxy({}, {get:(_,key)=>`${name}.${String(key)}`});
 let reads=0;
 const db={select:(fields)=>{reads++;const rows=fields.linkedPersonName?[{materialId:123,linkedPersonName:'Audit Person'}]:[{id:123,title:'Audit Draft',status:'draft'}];const chain=new Proxy({}, {get:(_,key)=>key==='then'?Promise.resolve(rows).then.bind(Promise.resolve(rows)):()=>chain});return chain;}};
 const orm={};for(const f of ['and','asc','eq','ilike','inArray','notInArray','or'])orm[f]=()=>({});
 const route=load('src/app/api/admin/group-photos/search/route.ts',{'next/server':{NextResponse:{json:(body)=>({status:200,body})}},'drizzle-orm':orm,'@/db':{db},'@/db/schema':schema});
 const result=await route.GET({nextUrl:new URL('http://fixture.invalid/api/admin/group-photos/search?q=Audit')});
 assert.equal(result.status,200);assert.equal(result.body[0].status,'draft');assert.ok(reads>0);
 console.log('PASS: source GET reaches fixture DB without any session/cookies dependency and serializes draft metadata.');
 console.log('LIMIT: fixture DB does not validate SQL execution, HTTP routing or production NGINX.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
