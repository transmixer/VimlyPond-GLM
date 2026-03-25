'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useVimlypondStore } from '@/lib/vimlypond/store';
import { useVexFlowRenderer } from '@/lib/vimlypond/renderer';
import { t } from '@/lib/vimlypond/i18n';
import { midiToPitch } from '@/lib/vimlypond/music';
import type { NoteRect } from '@/lib/vimlypond/types';
import { Button } from '@/components/ui/button';
import {
  HelpCircle,
  Download,
  Trash2,
  X
} from 'lucide-react';

export default function VimlypondEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorOverlayRef = useRef<HTMLDivElement>(null);
  
  // 从store获取状态
  const {
    score,
    cursorPos,
    noteRects,
    lang,
    helpOpen,
    toastMessage,
    toastType,
    toastVisible,
    setNoteRects,
    setLang,
    setHelpOpen,
    saveToStorage,
    loadFromStorage,
    loadLanguage,
    undo,
    addStaffBelow,
    addStaffAbove,
    toggleClef,
    deleteElement,
    insertNote,
    addToChord,
    insertRest,
    modifyDuration,
    addDot,
    makeSharp,
    makeFlat,
    raiseOctave,
    lowerOctave,
    navigateUp,
    navigateDown,
    navigateLeft,
    navigateRight,
    navigatePrevMeasure,
    navigateNextMeasure,
    enterInsertMode,
    enterNormalMode,
    repeatLastAction,
    redo,
    showToast,
    exportLilyPond,
    clearScore
  } = useVimlypondStore();
  
  // 渲染乐谱
  const { renderScore, vfReady } = useVexFlowRenderer(
    containerRef,
    score,
    setNoteRects
  );
  
  // 插入模式输入处理
  const handleInsertInput = useCallback((key: string, shiftKey: boolean) => {
    // 音符输入（Shift + 音符 = 添加到和弦）
    if (['a', 'b', 'c', 'd', 'e', 'f', 'g'].includes(key)) {
      if (shiftKey) {
        addToChord(key);
      } else {
        insertNote(key);
      }
      return;
    }
    
    // 休止符
    if (key === 'r') {
      insertRest();
      return;
    }
    
    // 时值修改
    if (['1', '2', '4', '8', '6'].includes(key)) {
      const dur = key === '6' ? 16 : parseInt(key);
      modifyDuration(dur);
      return;
    }
    
    // 附点
    if (key === '.') {
      addDot();
      return;
    }
    
    // 升号
    if (key === '+' || key === '=') {
      makeSharp();
      return;
    }
    
    // 降号
    if (key === '-') {
      makeFlat();
      return;
    }
    
    // 升八度（LilyPond 语法中的 '）
    if (key === "'") {
      raiseOctave();
      return;
    }
    
    // 降八度（LilyPond 语法中的 ,）
    if (key === ',') {
      lowerOctave();
      return;
    }
  }, [insertNote, addToChord, insertRest, modifyDuration, addDot, makeSharp, makeFlat, raiseOctave, lowerOctave]);
  
  // 普通模式输入处理
  const handleNormalInput = useCallback((key: string, shiftKey: boolean) => {
    switch (key) {
      case 'i':
        enterInsertMode();
        break;
      case 'o':
        if (shiftKey) {
          addStaffAbove();
        } else {
          addStaffBelow();
        }
        break;
      case 't':
        toggleClef();
        break;
      case 'j':
        navigateDown();
        break;
      case 'k':
        navigateUp();
        break;
      case 'h':
        navigateLeft();
        break;
      case 'l':
        navigateRight();
        break;
      case 'n':
        navigateNextMeasure();
        break;
      case 'b':
        navigatePrevMeasure();
        break;
      case 'x':
        deleteElement();
        break;
      case 'u':
        if (undo()) {
          showToast(t('toastUndo', lang), 'info');
        }
        break;
      case "'":
        raiseOctave();
        break;
      case ',':
        lowerOctave();
        break;
      case '.':
        repeatLastAction();
        break;
    }
  }, [enterInsertMode, addStaffBelow, addStaffAbove, toggleClef, 
      navigateDown, navigateUp, navigateLeft, navigateRight,
      navigatePrevMeasure, navigateNextMeasure,
      deleteElement, undo, showToast, lang, raiseOctave, lowerOctave, repeatLastAction]);
  
  // 初始化
  useEffect(() => {
    loadLanguage();
    if (!loadFromStorage()) {
      // 使用默认乐谱
    }
    showToast(t('toastReady', lang), 'info');
  }, []);
  
  // 渲染更新 - 当 score 或 VexFlow 就绪时重新渲染
  useEffect(() => {
    if (vfReady && containerRef.current) {
      renderScore();
    }
  }, [score, vfReady, renderScore]);

  // 保存到存储
  useEffect(() => {
    saveToStorage();
  }, [score]);
  
  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = e.key.toLowerCase();
      
      // ESC - 返回普通模式
      if (key === 'escape') {
        enterNormalMode();
        renderScore();
        return;
      }
      
      // ? - 帮助
      if (key === '?' || (e.shiftKey && key === '/')) {
        setHelpOpen(!helpOpen);
        return;
      }
      
      // Ctrl+R - 重做
      if (e.ctrlKey && key === 'r') {
        e.preventDefault();
        if (redo()) {
          showToast(t('toastRedo', lang), 'info');
        }
        return;
      }
      
      if (cursorPos.mode === 'insert') {
        handleInsertInput(key, e.shiftKey);
      } else {
        handleNormalInput(key, e.shiftKey);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cursorPos.mode, helpOpen, handleInsertInput, handleNormalInput, enterNormalMode, setHelpOpen, renderScore, redo, showToast, lang]);
  
  // 更新光标位置
  useEffect(() => {
    if (!cursorOverlayRef.current || noteRects.length === 0) return;
    
    const overlay = cursorOverlayRef.current;
    overlay.innerHTML = '';
    
    const staff = score.staves[cursorPos.staffIndex];
    const measure = staff.measures[cursorPos.measureIndex];
    
    let rect: NoteRect | undefined;
    
    if (cursorPos.mode === 'normal') {
      // 普通模式：光标绑定到选中的音符
      // elementIndex 指向选中的音符索引（0-based）
      // 如果 elementIndex >= elements.length，选中最后一个音符
      const selectedIndex = Math.min(cursorPos.elementIndex, measure.elements.length - 1);
      
      if (selectedIndex >= 0 && measure.elements.length > 0) {
        rect = noteRects.find(r => 
          r.staffIndex === cursorPos.staffIndex && 
          r.measureIndex === cursorPos.measureIndex && 
          r.elementIndex === selectedIndex
        );
      }
    } else {
      // 插入模式：光标在 elementIndex 位置（插入点）
      if (measure.elements.length === 0) {
        // 空小节：找小节起始位置
        rect = noteRects.find(r => 
          r.staffIndex === cursorPos.staffIndex && 
          r.measureIndex === cursorPos.measureIndex && 
          r.elementIndex === 0
        );
      } else if (cursorPos.elementIndex <= measure.elements.length) {
        // 找当前插入位置的音符
        rect = noteRects.find(r => 
          r.staffIndex === cursorPos.staffIndex && 
          r.measureIndex === cursorPos.measureIndex && 
          r.elementIndex === cursorPos.elementIndex
        );
        
        // 如果找不到（在末尾插入），找前一个音符并定位在其右侧
        if (!rect && cursorPos.elementIndex > 0) {
          const prevRects = noteRects.filter(r => 
            r.staffIndex === cursorPos.staffIndex && 
            r.measureIndex === cursorPos.measureIndex && 
            r.elementIndex === cursorPos.elementIndex - 1
          );
          
          if (prevRects.length > 0) {
            rect = { 
              ...prevRects[0], 
              x: prevRects[0].x + prevRects[0].width, 
              width: 20 
            };
          }
        }
      }
    }
    
    if (!rect) {
      // 回退：找当前小节任意音符
      const measureRects = noteRects.filter(r => 
        r.staffIndex === cursorPos.staffIndex && 
        r.measureIndex === cursorPos.measureIndex
      );
      if (measureRects.length > 0) {
        rect = measureRects[0];
      }
    }
    
    if (rect) {
      const cursor = document.createElement('div');
      cursor.className = 'cursor-indicator';
      
      if (cursorPos.mode === 'insert') {
        cursor.classList.add('cursor-note');
        cursor.style.left = `${rect.x + (rect.width || 0) + 5}px`;
        cursor.style.top = `${rect.y}px`;
      } else {
        cursor.classList.add('cursor-block');
        // 普通模式：光标居中显示在音符上
        const cursorWidth = 24;
        const cursorHeight = rect.height || 40;
        cursor.style.width = `${cursorWidth}px`;
        cursor.style.height = `${cursorHeight}px`;
        cursor.style.left = `${rect.x + (rect.width || 20) / 2 - cursorWidth / 2}px`;
        cursor.style.top = `${rect.y}px`;
      }
      
      overlay.appendChild(cursor);
      
      // 自动滚动：确保光标在可视区域内
      const container = containerRef.current?.parentElement;
      if (container) {
        const cursorLeft = rect.x;
        const cursorRight = rect.x + (rect.width || 20);
        const containerRect = container.getBoundingClientRect();
        const scrollContainer = container;
        
        // 水平滚动
        if (cursorRight > scrollContainer.scrollLeft + containerRect.width - 50) {
          scrollContainer.scrollTo({
            left: cursorRight - containerRect.width + 100,
            behavior: 'smooth'
          });
        } else if (cursorLeft < scrollContainer.scrollLeft + 50) {
          scrollContainer.scrollTo({
            left: Math.max(0, cursorLeft - 100),
            behavior: 'smooth'
          });
        }
      }
    }
  }, [cursorPos, noteRects, score]);
  
  // 获取输入预览文本
  const getInputPreview = useCallback(() => {
    const measure = score.staves[cursorPos.staffIndex].measures[cursorPos.measureIndex];
    
    if (cursorPos.elementIndex > 0 && measure.elements.length > 0) {
      const lastEl = measure.elements[cursorPos.elementIndex - 1];
      if (lastEl.type === 'note') {
        const pitch = midiToPitch(lastEl.midiPitch);
        let str = pitch.name.toUpperCase();
        if (lastEl.alter === 1) str += '#';
        else if (lastEl.alter === -1) str += 'b';
        str += pitch.oct + ' dur:' + lastEl.duration;
        if (lastEl.dots > 0) str += '.'.repeat(lastEl.dots);
        return str;
      } else {
        return t('inputRest', lang) + ' dur:' + lastEl.duration;
      }
    }
    return t('inputReady', lang);
  }, [score, cursorPos, lang]);
  
  // 切换语言
  const handleToggleLanguage = useCallback(() => {
    setLang(lang === 'zh' ? 'en' : 'zh');
  }, [lang, setLang]);
  
  // 清空确认
  const handleClearScore = useCallback(() => {
    if (confirm(t('clearConfirm', lang))) {
      clearScore();
    }
  }, [lang, clearScore]);
  
  // 帮助面板内容
  const normalHelpItems = [
    { key: 'i', text: t('helpEnterInsert', lang) },
    { key: 'o', text: t('helpAddStaffBelow', lang) },
    { key: 'O', text: t('helpAddStaffAbove', lang) },
    { key: 'j / k', text: t('helpNavStaves', lang) },
    { key: 'h / l', text: t('helpNavElements', lang) },
    { key: 'n / b', text: t('helpNavMeasures', lang) },
    { key: 't', text: t('helpToggleClef', lang) },
    { key: "' / ,", text: t('helpOctave', lang) },
    { key: 'x', text: t('helpDelete', lang) },
    { key: 'u', text: t('helpUndo', lang) },
  ];
  
  const insertHelpItems = [
    { key: 'a b c d e f g', text: t('helpNoteNames', lang) },
    { key: 'r', text: t('helpRest', lang) },
    { key: '1 2 4 8 16', text: t('helpDuration', lang) },
    { key: '.', text: t('helpDotted', lang) },
    { key: '+', text: t('helpSharp', lang) },
    { key: '-', text: t('helpFlat', lang) },
    { key: "' / ,", text: t('helpOctave', lang) },
    { key: 'ESC', text: t('helpExit', lang) },
  ];
  
  return (
    <div className="h-screen flex flex-col bg-[#f8f9fa]" style={{ colorScheme: 'light' }}>
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#dee2e6] bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-[#1971c2]">Vim</span>
            <span className="text-[#495057]">lypond</span>
          </h1>
          <div 
            className={`mode-badge ${
              cursorPos.mode === 'insert' ? 'mode-insert' : 'mode-normal'
            }`}
          >
            {cursorPos.mode === 'insert' ? t('modeInsert', lang) : t('modeNormal', lang)}
          </div>
          <div className="w-px h-6 bg-[#dee2e6]" />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleClearScore}
            title={t('clearScore', lang)}
            className="text-[#868e96] hover:text-[#e03131] hover:bg-[#fff5f5]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="status-pill">
            <span>{t('staff', lang)}</span>
            <span className="value">{cursorPos.staffIndex + 1}</span>
          </div>
          <div className="status-pill">
            <span>{t('measure', lang)}</span>
            <span className="value">{cursorPos.measureIndex + 1}</span>
          </div>
          <div className="status-pill">
            <span>{t('clef', lang)}</span>
            <span className="value">
              {score.staves[cursorPos.staffIndex].clef === 'treble' ? 'G' : 'F'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={exportLilyPond}
          >
            <Download className="h-4 w-4 mr-2" />
            {t('export', lang)}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setHelpOpen(!helpOpen)}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-[#dee2e6]" />
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleToggleLanguage}
          >
            {lang === 'zh' ? 'EN' : '中'}
          </Button>
        </div>
      </header>
      
      {/* 乐谱区域 - 全宽 */}
      <main className="flex-1 overflow-auto relative">
        <div 
          ref={containerRef}
          id="score-svg"
          className="w-full h-full min-h-[200px] p-8"
        />
        <div 
          ref={cursorOverlayRef}
          className="cursor-overlay"
          id="cursor-overlay"
        />
        
        {/* 输入预览 - 浮动在右下角 */}
        {cursorPos.mode === 'insert' && (
          <div className="absolute bottom-4 right-4 z-20">
            <div className="input-preview px-4 py-2 bg-white/95 backdrop-blur border border-[#dee2e6] rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-[#868e96] text-xs">
                  {t('lastInput', lang)}
                </span>
                <code className="mono text-[#2f9e44] font-semibold">
                  {getInputPreview()}
                </code>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* 快捷键栏 */}
      <footer className="shortcut-bar px-6 py-3 bg-[#f1f3f5] border-t border-[#dee2e6]">
        {cursorPos.mode === 'normal' ? (
          <div className="flex items-center gap-4 text-sm text-[#495057] flex-wrap">
            <div className="key-hint"><kbd>i</kbd> <span>{t('insert', lang)}</span></div>
            <div className="key-hint"><kbd>o</kbd> <span>{t('addStaffBelow', lang)}</span></div>
            <div className="key-hint"><kbd>O</kbd> <span>{t('addStaffAbove', lang)}</span></div>
            <div className="key-hint"><kbd>j</kbd><kbd>k</kbd> <span>{t('navigate', lang)}</span></div>
            <div className="key-hint"><kbd>h</kbd><kbd>l</kbd> <span>{t('elements', lang)}</span></div>
            <div className="key-hint"><kbd>n</kbd><kbd>b</kbd> <span>{t('measures', lang)}</span></div>
            <div className="key-hint"><kbd>t</kbd> <span>{t('toggleClef', lang)}</span></div>
            <div className="key-hint"><kbd>'</kbd><kbd>,</kbd> <span>{t('octave', lang)}</span></div>
            <div className="key-hint"><kbd>x</kbd> <span>{t('delete', lang)}</span></div>
            <div className="key-hint"><kbd>u</kbd> <span>{t('undo', lang)}</span></div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm text-[#495057] flex-wrap">
            <div className="key-hint"><kbd>a-g</kbd> <span>{t('notes', lang)}</span></div>
            <div className="key-hint"><kbd>r</kbd> <span>{t('rest', lang)}</span></div>
            <div className="key-hint"><kbd>1-9</kbd> <span>{t('duration', lang)}</span></div>
            <div className="key-hint"><kbd>.</kbd> <span>{t('dot', lang)}</span></div>
            <div className="key-hint"><kbd>+</kbd><kbd>-</kbd> <span>{t('sharpFlat', lang)}</span></div>
            <div className="key-hint"><kbd>'</kbd><kbd>,</kbd> <span>{t('octave', lang)}</span></div>
            <div className="key-hint"><kbd>ESC</kbd> <span>{t('normalMode', lang)}</span></div>
          </div>
        )}
      </footer>
      
      {/* 帮助面板 */}
      <div 
        className={`help-backdrop ${helpOpen ? 'open' : ''}`}
        onClick={() => setHelpOpen(false)}
      />
      <aside className={`help-panel ${helpOpen ? 'open' : ''}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">{t('helpTitle', lang)}</h2>
            <button onClick={() => setHelpOpen(false)} className="text-[#868e96]">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-6">
            <section>
              <h3 className="text-[#1971c2] font-semibold mb-3 text-sm uppercase tracking-wider">
                {t('normalModeTitle', lang)}
              </h3>
              <div className="space-y-2 text-sm">
                {normalHelpItems.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-[#868e96]">{item.text}</span>
                    <kbd className="mono text-[#212529]">{item.key}</kbd>
                  </div>
                ))}
              </div>
            </section>
            
            <section>
              <h3 className="text-[#2f9e44] font-semibold mb-3 text-sm uppercase tracking-wider">
                {t('insertModeTitle', lang)}
              </h3>
              <div className="space-y-2 text-sm">
                {insertHelpItems.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-[#868e96]">{item.text}</span>
                    <kbd className="mono text-[#212529]">{item.key}</kbd>
                  </div>
                ))}
              </div>
            </section>
            
            <section>
              <h3 className="text-[#495057] font-semibold mb-3 text-sm uppercase tracking-wider">
                {t('aboutTitle', lang)}
              </h3>
              <p className="text-sm leading-relaxed text-[#868e96]">
                {t('aboutText', lang)}
              </p>
            </section>
          </div>
        </div>
      </aside>
      
      {/* Toast */}
      <div 
        className={`toast ${toastType} ${toastVisible ? 'show' : ''}`}
      >
        {toastMessage}
      </div>
      
      <style jsx global>{`
        :root {
          --bg-primary: #f8f9fa;
          --bg-secondary: #ffffff;
          --bg-tertiary: #f1f3f5;
          --bg-card: #ffffff;
          --fg-primary: #212529;
          --fg-secondary: #495057;
          --fg-muted: #868e96;
          --accent-normal: #1971c2;
          --accent-insert: #2f9e44;
          --accent-warning: #e8590c;
          --accent-error: #e03131;
          --border: #dee2e6;
        }
        
        .mono { font-family: var(--font-jetbrains-mono), monospace; }
        
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
          color: var(--accent-normal);
          border: 1px solid rgba(25, 113, 194, 0.3);
        }
        
        .mode-insert {
          background: rgba(47, 158, 68, 0.1);
          color: var(--accent-insert);
          border: 1px solid rgba(47, 158, 68, 0.3);
          animation: pulse-insert 2s ease-in-out infinite;
        }
        
        @keyframes pulse-insert {
          0%, 100% { box-shadow: 0 0 0 0 rgba(47, 158, 68, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(47, 158, 68, 0); }
        }
        
        #score-svg {
          background: var(--bg-secondary);
        }
        
        #score-svg svg {
          overflow: visible;
        }
        
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
          background: var(--accent-insert);
          border-radius: 1px;
          box-shadow: 0 0 8px rgba(47, 158, 68, 0.6);
          animation: blink 1s step-end infinite;
        }
        
        .cursor-block {
          background: rgba(25, 113, 194, 0.1);
          border: 2px solid var(--accent-normal);
          border-radius: 4px;
          box-shadow: 0 0 12px rgba(25, 113, 194, 0.3);
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        .shortcut-bar {
          background: var(--bg-tertiary);
          border-top: 1px solid var(--border);
        }
        
        .key-hint {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 0.7rem;
        }
        
        .key-hint kbd {
          font-family: var(--font-jetbrains-mono), monospace;
          font-weight: 600;
          color: var(--accent-normal);
          min-width: 1.25rem;
          text-align: center;
        }
        
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.75rem;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 999px;
          font-size: 0.75rem;
          color: var(--fg-secondary);
          font-family: var(--font-jetbrains-mono), monospace;
        }
        
        .status-pill .value {
          color: var(--fg-primary);
          font-weight: 600;
        }
        
        .toast {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          padding: 0.75rem 1.5rem;
          background: var(--bg-card);
          border: 1px solid var(--border);
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
        
        .toast.success { border-color: var(--accent-insert); }
        .toast.info { border-color: var(--accent-normal); }
        .toast.warning { border-color: var(--accent-warning); }
        
        .help-panel {
          position: fixed;
          top: 0;
          right: -400px;
          width: 400px;
          height: 100vh;
          background: var(--bg-secondary);
          border-left: 1px solid var(--border);
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
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 6px;
        }
        
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg-tertiary); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--fg-muted); }
        
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
