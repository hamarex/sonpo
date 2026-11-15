#!/usr/bin/env node
// 使い方: node work/validate.js [file ...]   （引数なし: work/part_1..4.js すべて＋全体の重複検査）
//        node work/validate.js ../data.js    （data.js も可: window.DATA 形式を自動判別）
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadFile(f) {
  const src = fs.readFileSync(f, 'utf8');
  const sandbox = { module: { exports: {} }, window: {} };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(src, sandbox, { filename: f });
  if (sandbox.window.DATA) return sandbox.window.DATA.chapters;
  const e = sandbox.module.exports;
  if (Array.isArray(e)) return e;
  if (e && Array.isArray(e.chapters)) return e.chapters;
  throw new Error('chapters 配列を取得できません: ' + f);
}

const isStr = (x) => typeof x === 'string' && x.length > 0;
const isNum = (x) => typeof x === 'number' && Number.isFinite(x);
const HTML_BAD = /<script|<iframe|<link|<img[^>]+src=["']?https?:|javascript:/i;

function validateChapters(chapters, label, errs, seen) {
  const err = (m) => errs.push(`[${label}] ${m}`);
  const dup = (id, kind) => { if (seen.has(id)) err(`ID重複: ${id} (${kind})`); else seen.add(id); };
  chapters.forEach((c, ci) => {
    const cp = `chapters[${ci}]`;
    if (!isNum(c.no) || !Number.isInteger(c.no) || c.no < 1) err(`${cp}.no 不正`);
    if (!isStr(c.title)) err(`${cp}.title 不正`);
    if (!isNum(c.headingCount)) err(`${cp}.headingCount 不正`);
    if (!isNum(c.basePages)) err(`${cp}.basePages 不正`);
    for (const k of ['lessons', 'ox', 'mc']) if (!Array.isArray(c[k])) err(`${cp}.${k} が配列でない`);
    if (!Array.isArray(c.lessons) || !Array.isArray(c.ox) || !Array.isArray(c.mc)) return;
    const cc = String(c.no).padStart(2, '0');
    const oxIds = new Set(c.ox.map((q) => q.id));
    const lessonIds = new Set();
    const pageTitlesByLesson = {};
    const referenced = new Map(); // oxId -> count
    c.lessons.forEach((l, li) => {
      const lp = `${cp}.lessons[${li}]`;
      if (!isStr(l.id) || !new RegExp(`^c${cc}-l\\d{2}$`).test(l.id)) err(`${lp}.id 形式不正: ${l.id} (期待 c${cc}-lNN)`);
      else { dup(l.id, 'lesson'); lessonIds.add(l.id); }
      if (!isStr(l.title)) err(`${lp}.title 不正`);
      if (!Array.isArray(l.sections) || !l.sections.every(isStr)) err(`${lp}.sections 不正`);
      if (!isStr(l.html)) err(`${lp}.html 不正`); else if (HTML_BAD.test(l.html)) err(`${lp}.html 禁止タグ`);
      if (!Array.isArray(l.pages) || !l.pages.length) { err(`${lp}.pages が空/不正`); return; }
      pageTitlesByLesson[l.id] = new Set();
      l.pages.forEach((p, pi) => {
        const pp = `${lp}.pages[${pi}]`;
        if (!isStr(p.id) || !new RegExp(`^${l.id}-p\\d{2}$`).test(p.id)) err(`${pp}.id 形式不正: ${p.id}`);
        else dup(p.id, 'page');
        if (!isStr(p.title)) err(`${pp}.title 不正`); else pageTitlesByLesson[l.id].add(p.title);
        if (typeof p.cont !== 'boolean') err(`${pp}.cont boolean でない`);
        if (!isStr(p.html)) err(`${pp}.html 不正`); else if (HTML_BAD.test(p.html)) err(`${pp}.html 禁止タグ`);
        if (!Array.isArray(p.oxIds) || !p.oxIds.every(isStr)) err(`${pp}.oxIds 不正`);
        else p.oxIds.forEach((id) => {
          if (!oxIds.has(id)) err(`${pp}.oxIds に存在しないOx: ${id}`);
          referenced.set(id, (referenced.get(id) || 0) + 1);
        });
      });
      if (Array.isArray(l.sections) && l.sections.length !== l.pages.length) err(`${lp} sections数(${l.sections.length})≠pages数(${l.pages.length})`);
    });
    c.ox.forEach((q, qi) => {
      const qp = `${cp}.ox[${qi}](${q.id})`;
      if (!isStr(q.id) || !new RegExp(`^c${cc}-ox-\\d{2,}$`).test(q.id)) err(`${qp}.id 形式不正 (期待 c${cc}-ox-NN)`);
      else dup(q.id, 'ox');
      if (!isStr(q.text)) err(`${qp}.text 不正`);
      if (typeof q.answer !== 'boolean') err(`${qp}.answer boolean でない`);
      if (!isStr(q.explain)) err(`${qp}.explain 不正`);
      if (!isStr(q.sec)) err(`${qp}.sec 不正`);
      if (!isStr(q.lesson) || !lessonIds.has(q.lesson)) err(`${qp}.lesson が存在しない: ${q.lesson}`);
      else if (isStr(q.sec) && !pageTitlesByLesson[q.lesson].has(q.sec)) err(`${qp}.sec がレッスン内のpage.titleに一致しない: ${q.sec}`);
      if (referenced.get(q.id) !== 1) err(`${qp} はちょうど1つのPage.oxIdsから参照される必要あり (現在 ${referenced.get(q.id) || 0})`);
      const keys = Object.keys(q).sort().join();
      if (keys !== 'answer,explain,id,lesson,sec,text') err(`${qp} 余分/不足フィールド: ${keys}`);
    });
    c.mc.forEach((q, qi) => {
      const qp = `${cp}.mc[${qi}](${q.id})`;
      if (!isStr(q.id) || !new RegExp(`^c${cc}-mc-\\d{2,}$`).test(q.id)) err(`${qp}.id 形式不正 (期待 c${cc}-mc-NN)`);
      else dup(q.id, 'mc');
      if (!isStr(q.stem)) err(`${qp}.stem 不正`);
      if (!Array.isArray(q.items) || !q.items.every((it) => it && isStr(it.label) && isStr(it.text))) err(`${qp}.items 不正`);
      if (!Array.isArray(q.choices) || q.choices.length !== 5 || !q.choices.every(isStr)) err(`${qp}.choices はstring5つ必須`);
      else if (new Set(q.choices).size !== 5) err(`${qp}.choices に重複`);
      if (!Number.isInteger(q.answer) || q.answer < 1 || q.answer > 5) err(`${qp}.answer は1〜5の整数 (現在 ${q.answer})`);
      if (!Array.isArray(q.explain) || !q.explain.length || !q.explain.every(isStr)) err(`${qp}.explain は非空string[]`);
      else if (Array.isArray(q.items) && q.items.length && q.explain.length < q.items.length) err(`${qp}.explain 要素数(${q.explain.length}) < items数(${q.items.length})`);
      if (typeof q.tip !== 'string') err(`${qp}.tip はstring(空可)`);
      const keys = Object.keys(q).sort().join();
      if (keys !== 'answer,choices,explain,items,stem,tip,id'.split(',').sort().join()) err(`${qp} 余分/不足フィールド: ${keys}`);
    });
    // Ox混入チェック: 全OxがPage参照済み(上で検査)。Ox/Mc 件数の目安
    if (c.ox.length < 20) console.warn(`[${label}] 注意: 第${c.no}章 ox が少ない(${c.ox.length})`);
    if (c.mc.length < 5) console.warn(`[${label}] 注意: 第${c.no}章 mc が少ない(${c.mc.length})`);
  });
}

function main() {
  let files = process.argv.slice(2);
  const whole = files.length === 0;
  if (whole) files = [1, 2, 3, 4].map((n) => path.join(__dirname, `part_${n}.js`)).filter((f) => fs.existsSync(f));
  if (!files.length) { console.error('検査対象ファイルがありません'); process.exit(2); }
  const errs = [], seen = new Set(), chNos = new Map(), stats = [];
  files.forEach((f) => {
    let chapters;
    try { chapters = loadFile(path.resolve(f)); } catch (e) { errs.push(`[${f}] 読込失敗: ${e.message}`); return; }
    const partSeen = new Set();
    validateChapters(chapters, path.basename(f), errs, whole || files.length > 1 ? seen : partSeen);
    chapters.forEach((c) => {
      if (chNos.has(c.no)) errs.push(`章番号重複: ${c.no} (${chNos.get(c.no)} と ${path.basename(f)})`);
      chNos.set(c.no, path.basename(f));
      stats.push(`${path.basename(f)} 第${c.no}章「${c.title}」 lessons=${(c.lessons||[]).length} pages=${(c.lessons||[]).reduce((n,l)=>n+(l.pages||[]).length,0)} ox=${(c.ox||[]).length} mc=${(c.mc||[]).length}`);
    });
  });
  stats.forEach((s) => console.log(s));
  if (errs.length) { console.error(`\nNG: ${errs.length} 件`); errs.slice(0, 200).forEach((e) => console.error(' - ' + e)); process.exit(1); }
  console.log(`\nOK: ${files.length}ファイル検査、ID総数 ${seen.size || "(単体検査)"}、エラー0`);
}
main();
