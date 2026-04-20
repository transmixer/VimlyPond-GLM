import { describe, it, expect, beforeEach } from 'vitest';
import { useVimlypondStoreV2 } from './store-v2';

describe('store-v2 基本状态测试', () => {
  beforeEach(() => {
    const store = useVimlypondStoreV2.getState();
    store.setScore(store.score);
    store.cursorPos = {
      staffIndex: 0,
      measureIndex: 0,
      voiceIndex: 0,
      elementIndex: 0,
      mode: 'normal'
    };
  });

  it('应该有一个默认的 Score', () => {
    const state = useVimlypondStoreV2.getState();
    expect(state.score.groups.length).toBeGreaterThan(0);
    expect(state.score.meter).toBeDefined();
  });

  it('应该支持设置语言', () => {
    const store = useVimlypondStoreV2.getState();
    store.setLang('en');
    expect(useVimlypondStoreV2.getState().lang).toBe('en');
    store.setLang('zh');
    expect(useVimlypondStoreV2.getState().lang).toBe('zh');
  });

  it('应该支持设置光标位置', () => {
    const store = useVimlypondStoreV2.getState();
    store.setCursorPos({ staffIndex: 1, measureIndex: 2 });
    const state = useVimlypondStoreV2.getState();
    expect(state.cursorPos.staffIndex).toBe(1);
    expect(state.cursorPos.measureIndex).toBe(2);
  });

  it('应该支持设置输入状态', () => {
    const store = useVimlypondStoreV2.getState();
    store.setInputState({ lastDuration: 8, lastDots: 1 });
    const state = useVimlypondStoreV2.getState();
    expect(state.inputState.lastDuration).toBe(8);
    expect(state.inputState.lastDots).toBe(1);
  });
});

describe('store-v2 历史记录测试', () => {
  beforeEach(() => {
    const store = useVimlypondStoreV2.getState();
    store.setScore(store.score);
  });

  it('应该保存状态到历史', () => {
    const store = useVimlypondStoreV2.getState();
    store.saveState();
    expect(store.history.past.length).toBe(1);
  });

  it('应该支持撤销', () => {
    const store = useVimlypondStoreV2.getState();
    const initialScore = JSON.stringify(store.score);
    store.saveState();
    store.setScore({ ...store.score, meter: { count: 3, unit: 4 } });
    store.undo();
    expect(JSON.stringify(store.score)).toBe(initialScore);
  });

  it('应该支持重做', () => {
    const store = useVimlypondStoreV2.getState();
    store.saveState();
    store.setScore({ ...store.score, meter: { count: 3, unit: 4 } });
    store.undo();
    store.redo();
    expect(store.score.meter.count).toBe(3);
  });
});

describe('store-v2 导航测试', () => {
  it('应该在元素内左右移动', () => {
    const store = useVimlypondStoreV2.getState();
    store.setCursorPos({ elementIndex: 2 });
    store.navigateLeft();
    expect(useVimlypondStoreV2.getState().cursorPos.elementIndex).toBe(1);
    store.navigateRight();
    expect(useVimlypondStoreV2.getState().cursorPos.elementIndex).toBe(2);
  });

  it('不应该在边界外左移', () => {
    const store = useVimlypondStoreV2.getState();
    store.setCursorPos({ elementIndex: 0 });
    store.navigateLeft();
    expect(useVimlypondStoreV2.getState().cursorPos.elementIndex).toBe(0);
  });
});

describe('store-v2 模式切换测试', () => {
  it('应该支持进入插入模式', () => {
    const store = useVimlypondStoreV2.getState();
    store.enterInsertMode();
    expect(useVimlypondStoreV2.getState().cursorPos.mode).toBe('insert');
  });

  it('应该支持进入普通模式', () => {
    const store = useVimlypondStoreV2.getState();
    store.enterInsertMode();
    store.enterNormalMode();
    expect(useVimlypondStoreV2.getState().cursorPos.mode).toBe('normal');
  });
});
