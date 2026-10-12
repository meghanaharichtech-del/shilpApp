import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const source=readFileSync(new URL('../src/context/favoritesStore.js',import.meta.url),'utf8');
const {createFavoritesStore}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const project={_id:'p1',name:'Property'};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('add/remove updates all screen subscribers and makes exactly one request',async()=>{
 const calls=[];const store=createFavoritesStore({list:async()=>[],add:async id=>calls.push(['add',id]),remove:async id=>calls.push(['remove',id])});
 const first=[],second=[];store.subscribe(s=>first.push(s.projects.length));store.subscribe(s=>second.push(s.projects.length));
 await store.refresh();await store.toggle(project);assert.ok(store.isFavorite(project));await store.toggle(project);assert.ok(!store.isFavorite(project));
 assert.deepEqual(calls,[['add','p1'],['remove','p1']]);assert.deepEqual(first,second);
});
test('optimistic add/remove rollback on failed requests',async()=>{
 const add=deferred();const store=createFavoritesStore({list:async()=>[],add:()=>add.promise});await store.refresh();const task=store.toggle(project);assert.ok(store.isFavorite(project));add.reject(new Error('Offline'));await assert.rejects(task);assert.ok(!store.isFavorite(project));
 const remove=deferred();const liked=createFavoritesStore({list:async()=>[{project}],remove:()=>remove.promise});await liked.refresh();const removal=liked.toggle(project);assert.ok(!liked.isFavorite(project));remove.reject(new Error('Offline'));await assert.rejects(removal);assert.ok(liked.isFavorite(project));
});
test('rapid taps on multiple screens cannot duplicate a mutation',async()=>{
 const add=deferred();let requests=0;const store=createFavoritesStore({list:async()=>[],add:()=>{requests++;return add.promise;}});await store.refresh();const task=store.toggle(project);await store.toggle(project);assert.equal(requests,1);add.resolve();await task;
});
test('stale GET responses cannot undo a recent like',async()=>{
 const get=deferred();let count=0;const store=createFavoritesStore({list:()=>++count===1?Promise.resolve([]):get.promise,add:async()=>{}});await store.refresh();const refresh=store.refresh();await store.toggle(project);get.resolve([]);await refresh;assert.ok(store.isFavorite(project));
});
test('refresh started during mutation cannot undo the optimistic heart',async()=>{
 const add=deferred();const store=createFavoritesStore({list:async()=>[],add:()=>add.promise});await store.refresh();const task=store.toggle(project);await store.refresh();assert.ok(store.isFavorite(project));add.resolve();await task;assert.ok(store.isFavorite(project));
});
test('logout/account switch ignores stale mutation results and clears pending state',async()=>{
 const add=deferred();const store=createFavoritesStore({list:async()=>[],add:()=>add.promise});await store.refresh();const task=store.toggle(project);store.reset();add.resolve();await task;assert.equal(store.getSnapshot().projects.length,0);assert.equal(store.getSnapshot().pending.size,0);assert.equal(store.getSnapshot().loaded,false);
});
test('deleted populated projects are not shown in the library',async()=>{
 const store=createFavoritesStore({list:async()=>[{project:null},{project}],add:async()=>{}});await store.refresh();assert.equal(store.getSnapshot().projects.length,1);
});
