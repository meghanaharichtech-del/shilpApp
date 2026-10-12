import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../src/utils/favoriteApi.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
test('mobile GET, POST and DELETE use authenticated API contract and preserve session binding',async()=>{
 const calls=[];
 const apiRequest=async(...args)=>{calls.push(args);return {success:true,favorites:[{project:{_id:'p1'}}]};};
 const api=new Function('apiRequest',`${source}\nreturn {getFavorites,addFavorite,removeFavorite};`)(apiRequest);
 assert.equal((await api.getFavorites('session-A'))[0].project._id,'p1');
 await api.addFavorite('p1','session-A');await api.removeFavorite('p1','session-A');
 assert.deepEqual(calls.map(call=>[call[0],call[1]]),[['api/favorites','get'],['api/favorites','post'],['api/favorites/p1','delete']]);
 assert.deepEqual(calls[1][2],{projectId:'p1'});
 for(const call of calls){assert.equal(call[3],true);assert.equal(call[4].rawResponse,true);assert.equal(call[4].expectedSessionToken,'session-A');}
});
