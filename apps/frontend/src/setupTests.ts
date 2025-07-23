// vitest setup file
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) 