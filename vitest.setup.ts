import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock VexFlow
const mockVexFlow = {
  Renderer: vi.fn().mockImplementation(() => ({
    resize: vi.fn(),
    getContext: vi.fn().mockReturnValue({
      setFont: vi.fn(),
    }),
  })),
  Stave: vi.fn().mockImplementation(() => ({
    addClef: vi.fn().mockReturnThis(),
    addTimeSignature: vi.fn().mockReturnThis(),
    setContext: vi.fn().mockReturnThis(),
    draw: vi.fn(),
  })),
  StaveNote: vi.fn().mockImplementation(() => ({
    addModifier: vi.fn(),
    addDotToAll: vi.fn(),
    getBoundingBox: vi.fn().mockReturnValue({
      getX: () => 100,
      getY: () => 50,
      getW: () => 20,
      getH: () => 30,
    }),
  })),
  Voice: vi.fn().mockImplementation(() => ({
    setStrict: vi.fn().mockReturnThis(),
    addTickables: vi.fn(),
    draw: vi.fn(),
  })),
  Formatter: vi.fn().mockImplementation(() => ({
    joinVoices: vi.fn().mockReturnThis(),
    format: vi.fn(),
  })),
  Accidental: vi.fn(),
};

// 设置全局 Vex.Flow
(mockVexFlow.Renderer as unknown as { Backends: { SVG: number } }).Backends = { SVG: 1 };

global.window.Vex = {
  Flow: mockVexFlow as unknown as typeof window.Vex.Flow,
} as unknown as typeof window.Vex;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
