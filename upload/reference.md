\<!DOCTYPE html\>

\<html lang=\"zh-CN\"\>

\<head\>

\<meta charset=\"UTF-8\"\>

\<meta name=\"viewport\" content=\"width=device-width,
initial-scale=1.0\"\>

\<title\>Vimlypond\</title\>

\<script src=\"https://cdn.tailwindcss.com\"\>\</script\>

\<link
href=\"https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap\"
rel=\"stylesheet\"\>

\<style\>

:root {

\--bg-primary: #f8f9fa;

\--bg-secondary: #ffffff;

\--bg-tertiary: #f1f3f5;

\--bg-card: #ffffff;

\--fg-primary: #212529;

\--fg-secondary: #495057;

\--fg-muted: #868e96;

\--accent-normal: #1971c2;

\--accent-insert: #2f9e44;

\--accent-warning: #e8590c;

\--accent-error: #e03131;

\--border: #dee2e6;

}

\* { box-sizing: border-box; }

body {

font-family: \'Noto Sans SC\', sans-serif;

background: var(\--bg-primary);

color: var(\--fg-primary);

min-height: 100vh;

overflow: hidden;

color-scheme: light;

}

.mono { font-family: \'JetBrains Mono\', monospace; }

.mode-badge {

padding: 0.375rem 1rem;

border-radius: 4px;

font-weight: 600;

font-size: 0.75rem;

letter-spacing: 0.1em;

text-transform: uppercase;

transition: all 0.2s ease;

}

.mode-normal {

background: rgba(25, 113, 194, 0.1);

color: var(\--accent-normal);

border: 1px solid rgba(25, 113, 194, 0.3);

}

.mode-insert {

background: rgba(47, 158, 68, 0.1);

color: var(\--accent-insert);

border: 1px solid rgba(47, 158, 68, 0.3);

animation: pulse-insert 2s ease-in-out infinite;

}

\@keyframes pulse-insert {

0%, 100% { box-shadow: 0 0 0 0 rgba(47, 158, 68, 0.4); }

50% { box-shadow: 0 0 0 6px rgba(47, 158, 68, 0); }

}

.score-container {

background: var(\--bg-secondary);

border: 1px solid var(\--border);

border-radius: 8px;

position: relative;

overflow: auto;

box-shadow: 0 1px 3px rgba(0,0,0,0.08);

}

#score-svg {

min-height: 200px;

background: #ffffff;

padding: 20px 10px;

}

/\* VexFlow SVG 样式微调 \*/

#score-svg svg {

overflow: visible;

}

/\* 光标叠加层 \*/

.cursor-overlay {

position: absolute;

top: 0;

left: 0;

width: 100%;

height: 100%;

pointer-events: none;

z-index: 10;

}

.cursor-indicator {

position: absolute;

transition: all 0.12s ease-out;

}

.cursor-note {

width: 2px;

height: 32px;

background: var(\--accent-insert);

border-radius: 1px;

box-shadow: 0 0 8px rgba(47, 158, 68, 0.6);

animation: blink 1s step-end infinite;

}

.cursor-block {

width: 20px;

height: 20px;

background: rgba(25, 113, 194, 0.15);

border: 2px solid var(\--accent-normal);

border-radius: 4px;

box-shadow: 0 0 12px rgba(25, 113, 194, 0.3);

}

\@keyframes blink {

0%, 100% { opacity: 1; }

50% { opacity: 0.3; }

}

.shortcut-bar {

background: var(\--bg-tertiary);

border-top: 1px solid var(\--border);

}

.key-hint {

display: inline-flex;

align-items: center;

gap: 0.25rem;

padding: 0.25rem 0.5rem;

background: var(\--bg-secondary);

border: 1px solid var(\--border);

border-radius: 4px;

font-size: 0.7rem;

}

.key-hint kbd {

font-family: \'JetBrains Mono\', monospace;

font-weight: 600;

color: var(\--accent-normal);

min-width: 1.25rem;

text-align: center;

}

.btn {

padding: 0.5rem 1rem;

border-radius: 6px;

font-weight: 500;

font-size: 0.875rem;

transition: all 0.15s ease;

cursor: pointer;

border: 1px solid transparent;

}

.btn-outline {

background: transparent;

border-color: var(\--border);

color: var(\--fg-secondary);

}

.btn-outline:hover {

border-color: var(\--accent-normal);

color: var(\--accent-normal);

background: rgba(25, 113, 194, 0.05);

}

.btn-sm {

padding: 0.25rem 0.75rem;

font-size: 0.75rem;

}

.status-pill {

display: inline-flex;

align-items: center;

gap: 0.375rem;

padding: 0.25rem 0.75rem;

background: var(\--bg-card);

border: 1px solid var(\--border);

border-radius: 999px;

font-size: 0.75rem;

color: var(\--fg-secondary);

}

.status-pill .value {

color: var(\--fg-primary);

font-weight: 600;

}

.toast {

position: fixed;

bottom: 80px;

left: 50%;

transform: translateX(-50%) translateY(100px);

padding: 0.75rem 1.5rem;

background: var(\--bg-card);

border: 1px solid var(\--border);

border-radius: 8px;

font-size: 0.875rem;

opacity: 0;

transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

z-index: 100;

box-shadow: 0 4px 12px rgba(0,0,0,0.1);

}

.toast.show {

transform: translateX(-50%) translateY(0);

opacity: 1;

}

.toast.success { border-color: var(\--accent-insert); }

.toast.info { border-color: var(\--accent-normal); }

.toast.warning { border-color: var(\--accent-warning); }

.help-panel {

position: fixed;

top: 0;

right: -400px;

width: 400px;

height: 100vh;

background: var(\--bg-secondary);

border-left: 1px solid var(\--border);

transition: right 0.3s ease;

z-index: 50;

overflow-y: auto;

box-shadow: -4px 0 12px rgba(0,0,0,0.05);

}

.help-panel.open { right: 0; }

.help-backdrop {

position: fixed;

inset: 0;

background: rgba(0,0,0,0.3);

opacity: 0;

pointer-events: none;

transition: opacity 0.3s ease;

z-index: 40;

}

.help-backdrop.open {

opacity: 1;

pointer-events: auto;

}

.input-preview {

background: var(\--bg-card);

border: 1px solid var(\--border);

border-radius: 6px;

}

\@media (prefers-reduced-motion: reduce) {

\*, \*::before, \*::after {

animation-duration: 0.01ms !important;

transition-duration: 0.01ms !important;

}

}

::-webkit-scrollbar { width: 8px; height: 8px; }

::-webkit-scrollbar-track { background: var(\--bg-tertiary); }

::-webkit-scrollbar-thumb { background: var(\--border); border-radius:
4px; }

::-webkit-scrollbar-thumb:hover { background: var(\--fg-muted); }

\</style\>

\</head\>

\<body\>

\<div class=\"h-screen flex flex-col\"\>

\<!\-- 顶部栏 \--\>

\<header class=\"flex items-center justify-between px-6 py-4 border-b
border-\[var(\--border)\]\"\>

\<div class=\"flex items-center gap-4\"\>

\<h1 class=\"text-xl font-bold tracking-tight\"\>

\<span style=\"color: var(\--accent-normal)\"\>Vim\</span\>\<span
style=\"color: var(\--fg-secondary)\"\>lypond\</span\>

\</h1\>

\<div id=\"mode-indicator\" class=\"mode-badge
mode-normal\"\>普通\</div\>

\</div\>

\<div class=\"flex items-center gap-3\"\>

\<div class=\"status-pill mono\"\>

\<span data-i18n=\"staff\"\>谱表\</span\> \<span class=\"value\"
id=\"status-staff\"\>1\</span\>

\</div\>

\<div class=\"status-pill mono\"\>

\<span data-i18n=\"measure\"\>小节\</span\> \<span class=\"value\"
id=\"status-measure\"\>1\</span\>

\</div\>

\<div class=\"status-pill mono\"\>

\<span data-i18n=\"clef\"\>谱号\</span\> \<span class=\"value\"
id=\"status-clef\"\>G\</span\>

\</div\>

\</div\>

\<div class=\"flex items-center gap-2\"\>

\<button class=\"btn btn-outline btn-sm\" onclick=\"toggleLanguage()\"\>

\<span id=\"lang-btn\"\>EN\</span\>

\</button\>

\<button class=\"btn btn-outline\" onclick=\"exportLilyPond()\"\>

\<span class=\"flex items-center gap-2\"\>

\<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\"
stroke=\"currentColor\" stroke-width=\"2\"\>

\<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/\>

\<polyline points=\"7 10 12 15 17 10\"/\>

\<line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"3\"/\>

\</svg\>

\<span data-i18n=\"export\"\>导出 .ly\</span\>

\</span\>

\</button\>

\<button class=\"btn btn-outline\" onclick=\"toggleHelp()\"\>

\<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\"
stroke=\"currentColor\" stroke-width=\"2\"\>

\<circle cx=\"12\" cy=\"12\" r=\"10\"/\>

\<path d=\"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3\"/\>

\<line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/\>

\</svg\>

\</button\>

\</div\>

\</header\>

\<!\-- 乐谱区域 \--\>

\<main class=\"flex-1 overflow-auto p-6\"\>

\<div class=\"score-container max-w-5xl mx-auto\"
id=\"score-container\"\>

\<div id=\"score-svg\"\>\</div\>

\<div class=\"cursor-overlay\" id=\"cursor-overlay\"\>\</div\>

\</div\>

\<!\-- 输入预览 \--\>

\<div id=\"input-preview\" class=\"max-w-5xl mx-auto mt-4 hidden\"\>

\<div class=\"input-preview p-4\"\>

\<div class=\"flex items-center justify-between\"\>

\<span style=\"color: var(\--fg-muted); font-size: 0.875rem;\"
data-i18n=\"lastInput\"\>上次输入:\</span\>

\<code id=\"input-display\" class=\"mono\" style=\"color:
var(\--accent-insert); font-weight: 600; font-size:
1.125rem;\"\>\</code\>

\</div\>

\</div\>

\</div\>

\</main\>

\<!\-- 快捷键栏 \--\>

\<footer class=\"shortcut-bar px-6 py-3\"\>

\<div id=\"shortcuts-normal\" class=\"flex items-center gap-4 text-sm
flex-wrap\" style=\"color: var(\--fg-secondary);\"\>

\<div class=\"key-hint\"\>\<kbd\>i\</kbd\> \<span
data-i18n=\"insert\"\>输入\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>o\</kbd\> \<span
data-i18n=\"addStaffBelow\"\>下方加谱表\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>O\</kbd\> \<span
data-i18n=\"addStaffAbove\"\>上方加谱表\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>j\</kbd\>\<kbd\>k\</kbd\> \<span
data-i18n=\"navigate\"\>切换谱表\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>h\</kbd\>\<kbd\>l\</kbd\> \<span
data-i18n=\"measures\"\>切换小节\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>t\</kbd\> \<span
data-i18n=\"toggleClef\"\>切换谱号\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>x\</kbd\> \<span
data-i18n=\"delete\"\>删除\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>u\</kbd\> \<span
data-i18n=\"undo\"\>撤销\</span\>\</div\>

\</div\>

\<div id=\"shortcuts-insert\" class=\"hidden flex items-center gap-4
text-sm flex-wrap\" style=\"color: var(\--fg-secondary);\"\>

\<div class=\"key-hint\"\>\<kbd\>a-g\</kbd\> \<span
data-i18n=\"notes\"\>音符\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>r\</kbd\> \<span
data-i18n=\"rest\"\>休止符\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>1-9\</kbd\> \<span
data-i18n=\"duration\"\>时值\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>.\</kbd\> \<span
data-i18n=\"dot\"\>附点\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>+\</kbd\>\<kbd\>-\</kbd\> \<span
data-i18n=\"sharpFlat\"\>升降号\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>(\</kbd\>\<kbd\>)\</kbd\> \<span
data-i18n=\"slur\"\>连音线\</span\>\</div\>

\<div class=\"key-hint\"\>\<kbd\>ESC\</kbd\> \<span
data-i18n=\"normalMode\"\>普通模式\</span\>\</div\>

\</div\>

\</footer\>

\</div\>

\<!\-- 帮助面板 \--\>

\<div class=\"help-backdrop\" id=\"help-backdrop\"
onclick=\"toggleHelp()\"\>\</div\>

\<aside class=\"help-panel\" id=\"help-panel\"\>

\<div class=\"p-6\"\>

\<div class=\"flex items-center justify-between mb-6\"\>

\<h2 class=\"text-lg font-bold\"
data-i18n=\"helpTitle\"\>快捷键参考\</h2\>

\<button onclick=\"toggleHelp()\" style=\"color: var(\--fg-muted)\"\>

\<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\"
stroke=\"currentColor\" stroke-width=\"2\"\>

\<line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/\>

\<line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/\>

\</svg\>

\</button\>

\</div\>

\<div class=\"space-y-6\"\>

\<section\>

\<h3 style=\"color: var(\--accent-normal)\" class=\"font-semibold mb-3
text-sm uppercase tracking-wider\"
data-i18n=\"normalModeTitle\"\>普通模式\</h3\>

\<div class=\"space-y-2 text-sm\" id=\"help-normal\"\>\</div\>

\</section\>

\<section\>

\<h3 style=\"color: var(\--accent-insert)\" class=\"font-semibold mb-3
text-sm uppercase tracking-wider\"
data-i18n=\"insertModeTitle\"\>插入模式\</h3\>

\<div class=\"space-y-2 text-sm\" id=\"help-insert\"\>\</div\>

\</section\>

\<section\>

\<h3 style=\"color: var(\--fg-secondary)\" class=\"font-semibold mb-3
text-sm uppercase tracking-wider\" data-i18n=\"aboutTitle\"\>关于\</h3\>

\<p class=\"text-sm leading-relaxed\" style=\"color: var(\--fg-muted)\"
data-i18n=\"aboutText\"\>

Vimlypond 是一款受 Vim 启发的模态音乐记谱编辑器。它使用 LilyPond
语法概念，结合智能八度推断和 VexFlow 实时渲染。

\</p\>

\</section\>

\</div\>

\</div\>

\</aside\>

\<!\-- Toast \--\>

\<div class=\"toast\" id=\"toast\"\>\</div\>

\<!\-- VexFlow \--\>

\<script
src=\"https://cdn.jsdelivr.net/npm/vexflow@4.2.2/build/cjs/vexflow.js\"\>\</script\>

\<script\>

// =============================================

// 国际化翻译

// =============================================

const translations = {

zh: {

modeNormal: \'普通\', modeInsert: \'插入\', staff: \'谱表\', measure:
\'小节\', clef: \'谱号\',

export: \'导出 .ly\', langSwitch: \'EN\', insert: \'输入\',
addStaffBelow: \'下方加谱表\',

addStaffAbove: \'上方加谱表\', navigate: \'切换谱表\', measures:
\'切换小节\',

toggleClef: \'切换谱号\', delete: \'删除\', undo: \'撤销\', notes:
\'音符\', rest: \'休止符\',

duration: \'时值\', dot: \'附点\', sharpFlat: \'升降号\', slur:
\'连音线\', normalMode: \'普通模式\',

helpTitle: \'快捷键参考\', normalModeTitle: \'普通模式\',
insertModeTitle: \'插入模式\',

aboutTitle: \'关于\', aboutText: \'Vimlypond 是一款受 Vim
启发的模态音乐记谱编辑器。\',

helpEnterInsert: \'进入插入模式\', helpAddStaffBelow:
\'在下方添加谱表\',

helpAddStaffAbove: \'在上方添加谱表\', helpNavStaves: \'谱表间导航\',

helpNavMeasures: \'小节间导航\', helpToggleClef: \'切换谱号\',

helpDelete: \'删除元素\', helpUndo: \'撤销\', helpNoteNames: \'音名\',

helpRest: \'休止符\', helpDuration: \'时值\', helpDotted: \'附点\',

helpSharp: \'升号\', helpFlat: \'降号\', helpSlur: \'连音线\', helpExit:
\'返回普通模式\',

lastInput: \'上次输入:\', inputReady: \'就绪\', inputRest: \'休止符\',

toastReady: \'Vimlypond 就绪。按 i 插入音符。\', toastExported:
\'已导出至 score.ly\',

toastUndo: \'撤销\', toastNewMeasure: \'新小节已添加\', toastNoSpace:
\'小节空间不足\',

toastStaffAdded: \'谱表 {n} 已添加\', toastClefTreble: \'谱号: 高音\',
toastClefBass: \'谱号: 低音\'

},

en: {

modeNormal: \'NORMAL\', modeInsert: \'INSERT\', staff: \'Staff\',
measure: \'Meas\', clef: \'Clef\',

export: \'Export .ly\', langSwitch: \'中\', insert: \'insert\',
addStaffBelow: \'add staff below\',

addStaffAbove: \'add staff above\', navigate: \'navigate\', measures:
\'measures\',

toggleClef: \'toggle clef\', delete: \'delete\', undo: \'undo\', notes:
\'notes\', rest: \'rest\',

duration: \'duration\', dot: \'dot\', sharpFlat: \'sharp/flat\', slur:
\'slur\', normalMode: \'normal\',

helpTitle: \'Keyboard Reference\', normalModeTitle: \'Normal Mode\',
insertModeTitle: \'Insert Mode\',

aboutTitle: \'About\', aboutText: \'Vimlypond is a modal music notation
editor inspired by Vim.\',

helpEnterInsert: \'Enter Insert Mode\', helpAddStaffBelow: \'Add staff
below\',

helpAddStaffAbove: \'Add staff above\', helpNavStaves: \'Navigate
staves\',

helpNavMeasures: \'Navigate measures\', helpToggleClef: \'Toggle clef\',

helpDelete: \'Delete element\', helpUndo: \'Undo\', helpNoteNames:
\'Note names\',

helpRest: \'Rest\', helpDuration: \'Duration\', helpDotted: \'Dotted\',

helpSharp: \'Sharp\', helpFlat: \'Flat\', helpSlur: \'Slur\', helpExit:
\'Exit to Normal\',

lastInput: \'Last input:\', inputReady: \'Ready\', inputRest: \'Rest\',

toastReady: \'Vimlypond ready. Press i to insert notes.\',
toastExported: \'Exported to score.ly\',

toastUndo: \'Undo\', toastNewMeasure: \'New measure added\',
toastNoSpace: \'Not enough space\',

toastStaffAdded: \'Staff {n} added\', toastClefTreble: \'Clef: Treble
(G)\', toastClefBass: \'Clef: Bass (F)\'

}

};

// =============================================

// 全局状态

// =============================================

const STORAGE_KEY = \'vimlypond-score\';

const LANG_KEY = \'vimlypond-lang\';

const BEATS_PER_MEASURE = 4;

const INITIAL_MEASURES = 4;

const SEMITONES = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

const NOTE_NAMES = \[\'c\', \'d\', \'e\', \'f\', \'g\', \'a\', \'b\'\];

const VF = Vex.Flow;

let score = null;

let history = { past: \[\], future: \[\] };

let cursorPos = { staffIndex: 0, measureIndex: 0, elementIndex: 0, mode:
\'normal\' };

let inputState = { pendingNote: null, lastDuration: 4, lastDots: 0 };

let noteRects = \[\];

let currentLang = \'zh\';

function t(key) { return translations\[currentLang\]\[key\] \|\| key; }

function updateLanguage() {

document.querySelectorAll(\'\[data-i18n\]\').forEach(el =\> {

const key = el.getAttribute(\'data-i18n\');

if (translations\[currentLang\]\[key\]) el.textContent =
translations\[currentLang\]\[key\];

});

document.getElementById(\'lang-btn\').textContent = t(\'langSwitch\');

updateHelpPanel();

const indicator = document.getElementById(\'mode-indicator\');

indicator.textContent = cursorPos.mode === \'insert\' ?
t(\'modeInsert\') : t(\'modeNormal\');

localStorage.setItem(LANG_KEY, currentLang);

}

function updateHelpPanel() {

const normalItems = \[

{ key: \'i\', text: t(\'helpEnterInsert\') }, { key: \'o\', text:
t(\'helpAddStaffBelow\') },

{ key: \'O\', text: t(\'helpAddStaffAbove\') }, { key: \'j / k\', text:
t(\'helpNavStaves\') },

{ key: \'h / l\', text: t(\'helpNavMeasures\') }, { key: \'t\', text:
t(\'helpToggleClef\') },

{ key: \'x\', text: t(\'helpDelete\') }, { key: \'u\', text:
t(\'helpUndo\') }

\];

const insertItems = \[

{ key: \'a b c d e f g\', text: t(\'helpNoteNames\') }, { key: \'r\',
text: t(\'helpRest\') },

{ key: \'1 2 4 8 16\', text: t(\'helpDuration\') }, { key: \'.\', text:
t(\'helpDotted\') },

{ key: \'+\', text: t(\'helpSharp\') }, { key: \'-\', text:
t(\'helpFlat\') },

{ key: \'( )\', text: t(\'helpSlur\') }, { key: \'ESC\', text:
t(\'helpExit\') }

\];

document.getElementById(\'help-normal\').innerHTML =
normalItems.map(item =\> \`

\<div class=\"flex justify-between\"\>\<span style=\"color:
var(\--fg-muted)\"\>\${item.text}\</span\>\<kbd class=\"mono\"
style=\"color: var(\--fg-primary)\"\>\${item.key}\</kbd\>\</div\>

\`).join(\'\');

document.getElementById(\'help-insert\').innerHTML =
insertItems.map(item =\> \`

\<div class=\"flex justify-between\"\>\<span style=\"color:
var(\--fg-muted)\"\>\${item.text}\</span\>\<kbd class=\"mono\"
style=\"color: var(\--fg-primary)\"\>\${item.key}\</kbd\>\</div\>

\`).join(\'\');

}

function toggleLanguage() {

currentLang = currentLang === \'zh\' ? \'en\' : \'zh\';

updateLanguage();

updateInputDisplay();

}

// =============================================

// 数据模型

// =============================================

function createEmptyMeasure() { return { elements: \[\], durationUsed: 0
}; }

function createEmptyStaff() {

const measures = \[\];

for (let i = 0; i \< INITIAL_MEASURES; i++)
measures.push(createEmptyMeasure());

return { clef: \'treble\', measures };

}

function createDefaultScore() {

return { meter: { count: 4, unit: 4 }, staves: \[createEmptyStaff()\] };

}

function createNote(midiPitch, duration, dots = 0, alter = 0) {

return { type: \'note\', midiPitch, duration, dots, alter, tieStart:
false, tieEnd: false };

}

function createRest(duration, dots = 0) { return { type: \'rest\',
duration, dots }; }

// =============================================

// 音高计算

// =============================================

function midiToPitch(midi) {

const oct = Math.floor((midi - 12) / 12);

const semitone = ((midi - 12) % 12 + 12) % 12;

const noteIndex = NOTE_NAMES.findIndex((\_, i) =\> {

const s = SEMITONES\[NOTE_NAMES\[i\]\];

return semitone \>= s && (i === 6 \|\| semitone \<
SEMITONES\[NOTE_NAMES\[i + 1\]\]);

});

const name = NOTE_NAMES\[noteIndex\];

const alter = semitone - SEMITONES\[name\];

return { name, oct, alter };

}

function pitchToMidi(name, oct, alter = 0) {

return 12 + Math.max(0, Math.min(9, oct)) \* 12 + SEMITONES\[name\] +
alter;

}

function inferOctave(noteName, prevMidiPitch) {

if (prevMidiPitch === null) return 4;

const prevPitch = midiToPitch(prevMidiPitch);

const candidates = \[prevPitch.oct - 1, prevPitch.oct, prevPitch.oct +
1\];

let bestOct = prevPitch.oct, minDistance = Infinity;

for (const oct of candidates) {

const distance = Math.abs(pitchToMidi(noteName, oct) - prevMidiPitch);

if (distance \< minDistance) { minDistance = distance; bestOct = oct; }

}

return bestOct;

}

// =============================================

// 时值计算

// =============================================

function durationValue(dur, dots) {

const base = BEATS_PER_MEASURE / dur;

let value = base;

for (let i = 0; i \< dots; i++) value += base / Math.pow(2, i + 1);

return value;

}

function remainingInMeasure(measure) { return Math.max(0,
BEATS_PER_MEASURE - measure.durationUsed); }

// =============================================

// 历史记录

// =============================================

function saveState() {

history.past.push(JSON.stringify(score));

history.future = \[\];

if (history.past.length \> 50) history.past.shift();

}

function undo() {

if (history.past.length === 0) return false;

history.future.push(JSON.stringify(score));

score = JSON.parse(history.past.pop());

return true;

}

// =============================================

// VexFlow 渲染

// =============================================

function getVexFlowDuration(dur, dots, type) {

const map = { 1: \'w\', 2: \'h\', 4: \'q\', 8: \'8\', 16: \'16\' };

let vfd = map\[dur\] \|\| \'q\';

if (type === \'rest\') vfd += \'r\';

for (let i = 0; i \< dots; i++) vfd += \'d\';

return vfd;

}

function renderScore() {

const container = document.getElementById(\'score-svg\');

container.innerHTML = \'\';

noteRects = \[\];

const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);

const context = renderer.getContext();

context.setFont(\'Noto Sans SC\', 10);

const stavesData = \[\];

// 布局参数

const marginLeft = 20;

const measureWidth = 250;

const staveHeight = 120;

const totalHeight = score.staves.length \* staveHeight + 40;

const totalMeasures = score.staves\[0\].measures.length;

const svgWidth = marginLeft \* 2 + totalMeasures \* measureWidth;

renderer.resize(svgWidth, totalHeight);

// 绘制

score.staves.forEach((staff, sIdx) =\> {

let x = marginLeft;

const y = sIdx \* staveHeight + 20;

staff.measures.forEach((measure, mIdx) =\> {

const stave = new VF.Stave(x, y, measureWidth);

if (mIdx === 0) {

stave.addClef(staff.clef === \'treble\' ? \'treble\' : \'bass\');

stave.addTimeSignature(\'4/4\');

}

stave.setContext(context).draw();

const notes = \[\];

if (measure.elements.length === 0) {

notes.push(new VF.StaveNote({ keys: \[\'b/4\'\], duration: \'qr\',
auto_stem: false }));

} else {

measure.elements.forEach((el, eIdx) =\> {

if (el.type === \'rest\') {

const restNote = new VF.StaveNote({

keys: \[\'b/4\'\],

duration: getVexFlowDuration(el.duration, el.dots, \'rest\'),

auto_stem: false

});

for (let i = 0; i \< el.dots; i++) restNote.addDotToAll();

notes.push(restNote);

} else {

const pitch = midiToPitch(el.midiPitch);

const key = pitch.name + \'/\' + pitch.oct;

const note = new VF.StaveNote({

keys: \[key\],

duration: getVexFlowDuration(el.duration, el.dots, \'note\'),

auto_stem: true

});

if (el.alter === 1) note.addModifier(new VF.Accidental(\'#\'));

else if (el.alter === -1) note.addModifier(new VF.Accidental(\'b\'));

for (let i = 0; i \< el.dots; i++) note.addDotToAll();

// 连线处理 (简化版：仅连接相邻音符)

if (el.tieStart) {

// 需要找到下一个音符连接，此处略过复杂逻辑，仅作标记示意

}

notes.push(note);

}

});

}

if (notes.length \> 0) {

const voice = new VF.Voice({ num_beats: 4, beat_value: 4
}).setStrict(false);

voice.addTickables(notes);

const formatter = new VF.Formatter().joinVoices(\[voice\]);

formatter.format(\[voice\], measureWidth - 40);

voice.draw(context, stave);

// 收集音符位置

let tickableIndex = 0;

notes.forEach((note) =\> {

const bb = note.getBoundingBox();

if (bb) {

noteRects.push({

staffIndex: sIdx,

measureIndex: mIdx,

elementIndex: tickableIndex,

x: bb.getX() - 5,

y: bb.getY(),

width: bb.getW() + 10,

height: bb.getH()

});

}

tickableIndex++;

});

}

x += measureWidth;

});

});

updateCursor();

saveToStorage();

}

function updateCursor() {

const overlay = document.getElementById(\'cursor-overlay\');

overlay.innerHTML = \'\';

const staff = score.staves\[cursorPos.staffIndex\];

const measure = staff.measures\[cursorPos.measureIndex\];

let rect = null;

// 查找光标位置

if (measure.elements.length === 0) {

rect = noteRects.find(r =\> r.staffIndex === cursorPos.staffIndex &&
r.measureIndex === cursorPos.measureIndex && r.elementIndex === 0);

} else if (cursorPos.elementIndex \<= measure.elements.length) {

// 尝试找当前元素

rect = noteRects.find(r =\> r.staffIndex === cursorPos.staffIndex &&
r.measureIndex === cursorPos.measureIndex && r.elementIndex ===
cursorPos.elementIndex);

// 如果找不到(在末尾插入)，找前一个

if (!rect && cursorPos.elementIndex \> 0) {

const prevRects = noteRects.filter(r =\> r.staffIndex ===
cursorPos.staffIndex && r.measureIndex === cursorPos.measureIndex &&
r.elementIndex === cursorPos.elementIndex - 1);

if (prevRects.length \> 0) {

rect = { \...prevRects\[0\], x: prevRects\[0\].x + prevRects\[0\].width,
width: 20 };

}

}

}

if (!rect) {

const measureRects = noteRects.filter(r =\> r.staffIndex ===
cursorPos.staffIndex && r.measureIndex === cursorPos.measureIndex);

if (measureRects.length \> 0) rect = measureRects\[measureRects.length -
1\];

}

if (rect) {

const cursor = document.createElement(\'div\');

cursor.className = \'cursor-indicator\';

if (cursorPos.mode === \'insert\') {

cursor.classList.add(\'cursor-note\');

cursor.style.left = (rect.x + (rect.width \|\| 0) + 5) + \'px\';

cursor.style.top = (rect.y + 10) + \'px\';

} else {

cursor.classList.add(\'cursor-block\');

cursor.style.left = (rect.x + (rect.width \|\| 20) / 2 - 10) + \'px\';

cursor.style.top = (rect.y + (rect.height \|\| 30) / 2 - 10) + \'px\';

}

overlay.appendChild(cursor);

}

updateStatus();

}

function updateStatus() {

document.getElementById(\'status-staff\').textContent =
cursorPos.staffIndex + 1;

document.getElementById(\'status-measure\').textContent =
cursorPos.measureIndex + 1;

document.getElementById(\'status-clef\').textContent =
score.staves\[cursorPos.staffIndex\].clef === \'treble\' ? \'G\' :
\'F\';

const indicator = document.getElementById(\'mode-indicator\');

const shortcutsNormal = document.getElementById(\'shortcuts-normal\');

const shortcutsInsert = document.getElementById(\'shortcuts-insert\');

const inputPreview = document.getElementById(\'input-preview\');

if (cursorPos.mode === \'insert\') {

indicator.className = \'mode-badge mode-insert\';

indicator.textContent = t(\'modeInsert\');

shortcutsNormal.classList.add(\'hidden\');

shortcutsInsert.classList.remove(\'hidden\');

inputPreview.classList.remove(\'hidden\');

} else {

indicator.className = \'mode-badge mode-normal\';

indicator.textContent = t(\'modeNormal\');

shortcutsNormal.classList.remove(\'hidden\');

shortcutsInsert.classList.add(\'hidden\');

inputPreview.classList.add(\'hidden\');

}

}

// =============================================

// 输入处理

// =============================================

function getLastMidiPitch(staffIndex, measureIndex, elementIndex) {

const staff = score.staves\[staffIndex\];

for (let m = measureIndex; m \>= 0; m\--) {

const measure = staff.measures\[m\];

const startIdx = (m === measureIndex) ? elementIndex - 1 :
measure.elements.length - 1;

for (let e = startIdx; e \>= 0; e\--) {

if (measure.elements\[e\].type === \'note\') return
measure.elements\[e\].midiPitch;

}

}

return null;

}

function handleInsertInput(key) {

const staff = score.staves\[cursorPos.staffIndex\];

const measure = staff.measures\[cursorPos.measureIndex\];

if (\[\'a\', \'b\', \'c\', \'d\', \'e\', \'f\', \'g\'\].includes(key)) {

saveState();

const oct = inferOctave(key, getLastMidiPitch(cursorPos.staffIndex,
cursorPos.measureIndex, cursorPos.elementIndex));

const note = createNote(pitchToMidi(key, oct, 0),
inputState.lastDuration, inputState.lastDots);

const noteValue = durationValue(note.duration, note.dots);

if (noteValue \<= remainingInMeasure(measure)) {

measure.elements.splice(cursorPos.elementIndex, 0, note);

measure.durationUsed += noteValue;

cursorPos.elementIndex++;

inputState.pendingNote = note;

inputState.lastDots = 0;

if (measure.durationUsed \>= BEATS_PER_MEASURE) moveToNextMeasure();

} else showToast(t(\'toastNoSpace\'), \'warning\');

renderScore();

updateInputDisplay();

return;

}

if (key === \'r\') {

saveState();

const rest = createRest(inputState.lastDuration, inputState.lastDots);

const restValue = durationValue(rest.duration, rest.dots);

if (restValue \<= remainingInMeasure(measure)) {

measure.elements.splice(cursorPos.elementIndex, 0, rest);

measure.durationUsed += restValue;

cursorPos.elementIndex++;

inputState.lastDots = 0;

if (measure.durationUsed \>= BEATS_PER_MEASURE) moveToNextMeasure();

} else showToast(t(\'toastNoSpace\'), \'warning\');

renderScore();

updateInputDisplay();

return;

}

if (\[\'1\', \'2\', \'4\', \'8\', \'6\'\].includes(key)) {

let dur = parseInt(key);

if (key === \'6\') dur = 16;

if (cursorPos.elementIndex \> 0) {

const lastEl = measure.elements\[cursorPos.elementIndex - 1\];

if (lastEl && (lastEl.type === \'note\' \|\| lastEl.type === \'rest\'))
{

saveState();

const oldVal = durationValue(lastEl.duration, lastEl.dots);

const newVal = durationValue(dur, lastEl.dots);

if (newVal \<= remainingInMeasure(measure) + oldVal) {

lastEl.duration = dur;

measure.durationUsed += newVal - oldVal;

inputState.lastDuration = dur;

}

}

} else inputState.lastDuration = dur;

renderScore();

updateInputDisplay();

return;

}

if (key === \'.\' && cursorPos.elementIndex \> 0) {

const lastEl = measure.elements\[cursorPos.elementIndex - 1\];

if (lastEl && (lastEl.type === \'note\' \|\| lastEl.type === \'rest\'))
{

saveState();

const oldVal = durationValue(lastEl.duration, lastEl.dots);

const newVal = durationValue(lastEl.duration, lastEl.dots + 1);

if (newVal \<= remainingInMeasure(measure) + oldVal) {

lastEl.dots++;

measure.durationUsed += newVal - oldVal;

inputState.lastDots = lastEl.dots;

}

}

renderScore();

updateInputDisplay();

return;

}

if ((key === \'+\' \|\| key === \'=\') && cursorPos.elementIndex \> 0) {

const lastEl = measure.elements\[cursorPos.elementIndex - 1\];

if (lastEl && lastEl.type === \'note\' && lastEl.alter \< 1) {

saveState();

lastEl.alter = 1;

lastEl.midiPitch += 1;

renderScore();

}

updateInputDisplay();

return;

}

if (key === \'-\' && cursorPos.elementIndex \> 0) {

const lastEl = measure.elements\[cursorPos.elementIndex - 1\];

if (lastEl && lastEl.type === \'note\' && lastEl.alter \> -1) {

saveState();

lastEl.alter = -1;

lastEl.midiPitch -= 1;

renderScore();

}

updateInputDisplay();

return;

}

}

function handleNormalInput(key, shiftKey) {

if (key === \'i\') {

cursorPos.mode = \'insert\';

inputState.pendingNote = null;

updateStatus();

return;

}

if (key === \'o\' \|\| key === \'O\') {

saveState();

const newStaff = createEmptyStaff();

if (shiftKey \|\| key === \'O\')
score.staves.splice(cursorPos.staffIndex, 0, newStaff);

else { score.staves.splice(cursorPos.staffIndex + 1, 0, newStaff);
cursorPos.staffIndex++; }

cursorPos.measureIndex = 0;

cursorPos.elementIndex = 0;

showToast(t(\'toastStaffAdded\').replace(\'{n}\', cursorPos.staffIndex +
1), \'success\');

renderScore();

return;

}

if (key === \'t\') {

saveState();

const staff = score.staves\[cursorPos.staffIndex\];

staff.clef = staff.clef === \'treble\' ? \'bass\' : \'treble\';

showToast(staff.clef === \'treble\' ? t(\'toastClefTreble\') :
t(\'toastClefBass\'), \'info\');

renderScore();

return;

}

if (key === \'j\' && cursorPos.staffIndex \< score.staves.length - 1) {

cursorPos.staffIndex++;

cursorPos.elementIndex = 0;

renderScore();

return;

}

if (key === \'k\' && cursorPos.staffIndex \> 0) {

cursorPos.staffIndex\--;

cursorPos.elementIndex = 0;

renderScore();

return;

}

if (key === \'h\' && cursorPos.measureIndex \> 0) {

cursorPos.measureIndex\--;

cursorPos.elementIndex =
score.staves\[cursorPos.staffIndex\].measures\[cursorPos.measureIndex\].elements.length;

renderScore();

return;

}

if (key === \'l\') {

const staff = score.staves\[cursorPos.staffIndex\];

if (cursorPos.measureIndex \< staff.measures.length - 1) {

cursorPos.measureIndex++;

cursorPos.elementIndex = 0;

} else {

saveState();

for (const s of score.staves) s.measures.push(createEmptyMeasure());

cursorPos.measureIndex++;

cursorPos.elementIndex = 0;

showToast(t(\'toastNewMeasure\'), \'info\');

}

renderScore();

return;

}

if (key === \'x\' && cursorPos.elementIndex \> 0) {

const measure =
score.staves\[cursorPos.staffIndex\].measures\[cursorPos.measureIndex\];

if (measure.elements.length \> 0) {

saveState();

const el = measure.elements\[cursorPos.elementIndex - 1\];

measure.durationUsed -= durationValue(el.duration, el.dots);

measure.elements.splice(cursorPos.elementIndex - 1, 1);

cursorPos.elementIndex\--;

renderScore();

}

return;

}

if (key === \'u\' && undo()) {

showToast(t(\'toastUndo\'), \'info\');

renderScore();

}

}

function moveToNextMeasure() {

const staff = score.staves\[cursorPos.staffIndex\];

if (cursorPos.measureIndex \< staff.measures.length - 1) {

cursorPos.measureIndex++;

cursorPos.elementIndex = 0;

} else {

saveState();

for (const s of score.staves) s.measures.push(createEmptyMeasure());

cursorPos.measureIndex++;

cursorPos.elementIndex = 0;

}

}

function updateInputDisplay() {

const display = document.getElementById(\'input-display\');

const measure =
score.staves\[cursorPos.staffIndex\].measures\[cursorPos.measureIndex\];

if (cursorPos.elementIndex \> 0 && measure.elements.length \> 0) {

const lastEl = measure.elements\[cursorPos.elementIndex - 1\];

if (lastEl.type === \'note\') {

const pitch = midiToPitch(lastEl.midiPitch);

let str = pitch.name.toUpperCase();

if (lastEl.alter === 1) str += \'#\';

else if (lastEl.alter === -1) str += \'b\';

str += pitch.oct + \' dur:\' + lastEl.duration;

if (lastEl.dots \> 0) str += \'.\'.repeat(lastEl.dots);

display.textContent = str;

} else display.textContent = t(\'inputRest\') + \' dur:\' +
lastEl.duration;

} else display.textContent = t(\'inputReady\');

}

// =============================================

// 存储 & 导出

// =============================================

function saveToStorage() {

try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ score,
cursorPos })); } catch (e) {}

}

function loadFromStorage() {

try {

const data = localStorage.getItem(STORAGE_KEY);

if (data) {

const parsed = JSON.parse(data);

if (parsed.score && parsed.score.staves && parsed.score.staves.length \>
0) {

score = parsed.score;

cursorPos = parsed.cursorPos \|\| cursorPos;

return true;

}

}

} catch (e) {}

return false;

}

function loadLanguage() {

const saved = localStorage.getItem(LANG_KEY);

if (saved && (saved === \'zh\' \|\| saved === \'en\')) currentLang =
saved;

}

function generateLilyPond() {

let ly = \'\\\\version \"2.24.0\"\\n\\\\score {\\n \<\<\\n\';

for (let s = 0; s \< score.staves.length; s++) {

const staff = score.staves\[s\];

ly += \` \\\\new Staff {\\n \\\\clef \${staff.clef === \'treble\' ?
\'treble\' : \'bass\'}\\n \\\\time 4/4\\n\`;

for (let m = 0; m \< staff.measures.length; m++) {

const measure = staff.measures\[m\];

if (measure.elements.length === 0) ly += \' R1\\n\';

else {

let measureStr = \' \';

for (const el of measure.elements) {

if (el.type === \'rest\') {

measureStr += \'r\' + el.duration + \'.\'.repeat(el.dots) + \' \';

} else {

const pitch = midiToPitch(el.midiPitch);

let noteName = pitch.name;

if (el.alter === 1) noteName += \'is\';

else if (el.alter === -1) noteName += (pitch.name === \'a\' \|\|
pitch.name === \'e\') ? \'s\' : \'es\';

const octDiff = pitch.oct - 3;

measureStr += noteName + (octDiff \> 0 ? \"\'\".repeat(octDiff) :
\",\".repeat(-octDiff)) + el.duration + \'.\'.repeat(el.dots) + \' \';

}

}

ly += measureStr.trim() + \'\\n\';

}

}

ly += \' }\\n\';

}

return ly + \' \>\>\\n}\\n\';

}

function exportLilyPond() {

const blob = new Blob(\[generateLilyPond()\], { type: \'text/plain\' });

const a = document.createElement(\'a\');

a.href = URL.createObjectURL(blob);

a.download = \'score.ly\';

a.click();

URL.revokeObjectURL(a.href);

showToast(t(\'toastExported\'), \'success\');

}

function showToast(message, type = \'info\') {

const toast = document.getElementById(\'toast\');

toast.textContent = message;

toast.className = \'toast \' + type + \' show\';

setTimeout(() =\> toast.classList.remove(\'show\'), 2000);

}

function toggleHelp() {

document.getElementById(\'help-panel\').classList.toggle(\'open\');

document.getElementById(\'help-backdrop\').classList.toggle(\'open\');

}

// =============================================

// 键盘事件

// =============================================

document.addEventListener(\'keydown\', (e) =\> {

if (e.target.tagName === \'INPUT\' \|\| e.target.tagName ===
\'TEXTAREA\') return;

const key = e.key.toLowerCase();

if (key === \'escape\') { cursorPos.mode = \'normal\';
inputState.pendingNote = null; updateStatus(); renderScore(); return; }

if (key === \'?\' \|\| (e.shiftKey && key === \'/\')) { toggleHelp();
return; }

if (cursorPos.mode === \'insert\') handleInsertInput(key);

else handleNormalInput(key, e.shiftKey);

});

// =============================================

// 初始化

// =============================================

function init() {

loadLanguage();

if (!loadFromStorage()) score = createDefaultScore();

updateLanguage();

renderScore();

showToast(t(\'toastReady\'), \'info\');

}

if (document.readyState === \'loading\')
document.addEventListener(\'DOMContentLoaded\', init);

else init();

\</script\>

\</body\>

\</html\>
