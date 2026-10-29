// Static regression checks for the initial math runner source.
// Run with: node tests/static-regression.test.cjs
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../src/game.html'), 'utf8');
const assert = require('node:assert/strict');

const checks = [
  ['Mixed mode explicitly appends all three question pools', /gameMode === 'mixed'[\s\S]*appendPrimeQuestions\(\)[\s\S]*appendMultipleQuestions\('mult13'[\s\S]*appendMultipleQuestions\('mult19'/],
  ['Wrong-answer branch clears spawned gates', /buildFullQuestionPool\(\); \/\/ Re-shuffle complete dataset[\s\S]*gates\.forEach\(g =>[\s\S]*gates = \[\]/],
  ['Audio initialization guards against duplicate creation', /function initAudio\(\) \{[\s\S]*if \(synthCorrect && synthWrong && synthJump && synthWin && bgmLoop\) return;/],
  ['Keyboard and touch handlers remain present', /addEventListener\('keydown'/, /addEventListener\('touchstart'/, /addEventListener\('touchend'/],
  ['Original character PNGs are not yet wired into the working page (expected to be addressed in art integration)', /function createPlayer\(\)[\s\S]*new THREE\.SphereGeometry/]
];

let failed = 0;
for (const entry of checks) {
  const [label, ...patterns] = entry;
  const pass = patterns.every(pattern => pattern.test(html));
  console.log((pass ? 'PASS' : 'FAIL') + ' - ' + label);
  if (!pass) failed++;
}
if (failed) process.exitCode = 1;
