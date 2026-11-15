// 動作確認用の仮サンプル（最終 data.js には使わない）
function chapter(no, title, topics) {
  const cc = String(no).padStart(2, '0');
  const lid = `c${cc}-l01`;
  const pages = topics.map((t, i) => ({
    id: `${lid}-p${String(i + 1).padStart(2, '0')}`, title: t.title, cont: false,
    html: `<ul><li><b class="key">${t.key}</b>：${t.body}</li></ul>`,
    oxIds: t.ox.map((_, k) => `c${cc}-ox-${String(i * 10 + k + 1).padStart(2, '0')}`)
  }));
  const ox = [];
  topics.forEach((t, i) => t.ox.forEach((o, k) => ox.push({
    id: `c${cc}-ox-${String(i * 10 + k + 1).padStart(2, '0')}`, text: o[0], answer: o[1], explain: o[2], sec: t.title, lesson: lid
  })));
  const mc = [1, 2, 3].map((n) => ({
    id: `c${cc}-mc-0${n}`, stem: '【組合せ型】サンプルの記述のうち、正しいものの組合せはどれか。',
    items: [{ label: 'イ', text: 'サンプルA（正）' }, { label: 'ロ', text: 'サンプルB（誤）' }, { label: 'ハ', text: 'サンプルC（正）' }, { label: 'ニ', text: 'サンプルD（誤）' }],
    choices: ['イ・ロ', 'イ・ハ', 'ロ・ハ', 'ロ・ニ', 'ハ・ニ'], answer: 2,
    explain: ['イ：○ 正', 'ロ：× 誤', 'ハ：○ 正', 'ニ：× 誤'], tip: 'サンプル'
  }));
  return { no, title, headingCount: topics.length, basePages: topics.length,
    lessons: [{ id: lid, title: title + '（サンプル）', sections: topics.map((t) => t.title),
      html: topics.map((t) => `<h4>${t.title}</h4><ul><li><b class="key">${t.key}</b>：${t.body}</li></ul>`).join(''), pages }], ox, mc };
}
const T = (title, key, body, ox) => ({ title, key, body, ox });
module.exports = [
  chapter(1, '損害保険の基本', [
    T('保険の仕組み', '大数の法則', '多数の契約で損害発生率が安定する', [['大数の法則は保険料算出の基礎となる。', true, '多数の契約を集めると発生率が安定する'], ['収支相等の原則では、保険会社の収支は常に黒字となる。', false, '契約者全体の保険料総額と支払保険金総額が等しくなる原則']]),
    T('利得禁止の原則', '利得禁止', '損害保険は実損を超えて支払わない', [['損害保険では、実際の損害額を超える保険金が原則支払われる。', false, '利得禁止の原則に反する']])
  ]),
  chapter(3, '自動車保険', [
    T('自賠責保険', '自賠責', '強制加入。対人賠償のみ', [['自賠責保険は対物事故も補償する。', false, '対人のみ'], ['自賠責保険は原則すべての自動車に加入義務がある。', true, '強制保険']])
  ])
];
