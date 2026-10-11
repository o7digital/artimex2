import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/olivia.js';
const response = () => ({headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(data){this.data=data;return this}});
const req = body => ({method:'POST',headers:{origin:'https://www.artimexbakery.com','content-type':'application/json'},body});
test('rejects wrong origin, method, content type, message and conversation', async()=>{
 for (const [request,code] of [[{method:'GET',headers:{}},405],[{...req({}),headers:{origin:'https://other.example'}},403],[{...req({}),headers:{origin:'https://www.artimexbakery.com'}},415],[req({message:'x'.repeat(2001),language:'en'}),400],[req({message:'Hello',language:'en',conversation:{tenant:'other'}}),400]]) {
  const res=response();await handler(request,res);assert.equal(res.code,code);
 }
});
test('fixed gateway, restricted payload and no upstream credential disclosure', async()=>{
 const original=globalThis.fetch;process.env.OLIVIA_GATEWAY_KEY='test-secret';
 globalThis.fetch=async(url,options)=>{
  assert.equal(url,'https://olivia.o7digitalgroup.com/artimex/chat');
  assert.equal(options.headers.Authorization,'Bearer test-secret');
  assert.deepEqual(JSON.parse(options.body),{message:'Hello',language:'en'});
  return {ok:true,json:async()=>({answer:'Hello',conversation:'signed-id',access_token:'must-not-leak'})};
 };
 try {const res=response();await handler(req({message:' Hello ',language:'en',tenant:'other',routing:'POWERFUL'}),res);assert.equal(res.code,200);assert.deepEqual(res.data,{answer:'Hello',conversation:'signed-id',version:'3.5'});}
 finally {globalThis.fetch=original;delete process.env.OLIVIA_GATEWAY_KEY;}
});
test('upstream failures remain visible and rate limits are preserved',async()=>{
 const original=globalThis.fetch;process.env.OLIVIA_GATEWAY_KEY='test-secret';
 try {for(const code of [429,500]) {globalThis.fetch=async()=>({ok:false,status:code,json:async()=>({error:'Internal'})});const res=response();await handler(req({message:'Hello',language:'es'}),res);assert.equal(res.code,code===429?429:503);}}
 finally {globalThis.fetch=original;delete process.env.OLIVIA_GATEWAY_KEY;}
});
