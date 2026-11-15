#!/usr/bin/env node
// work/part_1..4.js を結合して ../data.js を生成。検証NGなら書き出さない。
// 使い方: node work/build.js [--out ../data.js] [part files...]（引数なし: part_1..4）
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const args = process.argv.slice(2);
let out = path.join(__dirname, '..', 'data.js');
const oi = args.indexOf('--out'); if (oi >= 0) { out = path.resolve(args[oi + 1]); args.splice(oi, 2); }
const files = args.length ? args.map((f) => path.resolve(f)) : [1, 2, 3, 4].map((n) => path.join(__dirname, `part_${n}.js`));
const missing = files.filter((f) => !fs.existsSync(f));
if (missing.length) { console.error('未作成: ' + missing.join(', ')); process.exit(2); }
const r = cp.spawnSync(process.execPath, [path.join(__dirname, 'validate.js'), ...files], { stdio: 'inherit' });
if (r.status !== 0) { console.error('検証NGのため data.js を生成しません'); process.exit(1); }
const chapters = [].concat(...files.map((f) => { delete require.cache[f]; const m = require(f); return Array.isArray(m) ? m : m.chapters; }));
chapters.sort((a, b) => a.no - b.no);
fs.writeFileSync(out, 'window.DATA = ' + JSON.stringify({ chapters }) + ';\n');
console.log(`生成: ${out} (${fs.statSync(out).size} bytes, ${chapters.length}章)`);
