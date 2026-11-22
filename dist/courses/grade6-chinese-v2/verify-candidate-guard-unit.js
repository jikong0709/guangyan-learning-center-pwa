"use strict";
const assert=require("node:assert/strict");
const {collisions,guardedBuildExam}=require("./candidate-cross-item-guard");
const specs={
 a:{type:"wrongchar",audit:{answer:"儉"},leakTerms:[]},
 b:{type:"lessonmc",leakTerms:[]},
 c:{type:"charphonetic",direction:"h",factChar:"標",leakTerms:[]},
 d:{type:"reading",leakTerms:[]},
 e:{type:"sentence",leakTerms:[]}
};
const bank={byId:id=>specs[id]};
const make=(specId,stem,options=[])=>({specId,stem,options});
const safe={items:[make("a","找出錯字"),make("b","簡僕如何修改？",["樸","僕"])]};
const leak={items:[make("a","找出錯字"),make("b","儉僕如何修改？",["樸","儉"])]};
assert.equal(collisions(safe,bank).length,0,"safe control is safe");
assert.equal(collisions(leak,bank).length,1,"wrongchar answer exposed in second question");
assert.equal(collisions({items:[make("c","注音填字"),make("d","哪一個標誌正確？",["對","錯"])]},bank).length,1,"charphonetic factChar exposed");
assert.equal(collisions({items:[make("a","找出錯字"),make("e","用儉造句")]},bank).length,0,"original sentence exemption");
const ok=guardedBuildExam({buildExam:()=>safe},bank,{},1);
assert.equal(ok.paper,safe,"safe paper returned");
assert.equal(ok.attempts,1);
assert.throws(()=>guardedBuildExam({buildExam:()=>leak},bank,{},3),/CANDIDATE_LEAK_GUARD_BLOCKED/);
let calls=0;
const retry=guardedBuildExam({buildExam:()=>++calls<3?leak:safe},bank,{},3);
assert.equal(retry.attempts,3,"guard retries until safe");
assert.throws(()=>guardedBuildExam({buildExam:()=>safe},bank,{},0),/attempts must be/);
console.log("GUARD_UNIT_PASS 8 assertions (isolated candidate; not 4400-paper clearance)");
