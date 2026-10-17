"use strict";
const assert=require('node:assert/strict');
const a=['L06-01','L06-02','L06-03'];
assert.equal(new Set(a).size,a.length);
console.log('LESSON06_UNIQUE_SMOKE_PASS');
