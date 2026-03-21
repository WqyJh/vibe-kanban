import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useDeviceType,
} from '@/hooks/useDeviceType';

// Mock useMediaQuery
vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(),
}));

import { useMediaQuery } from '@/hooks/useMediaQuery';

const mockUseMediaQuery = vi.mocked(useMediaQuery);

describe('useDeviceType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useIsMobile', () => {
    it('returns true when viewport is below 768px', () => {
      mockUseMediaQuery.mockReturnValue(true);
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
      expect(mockUseMediaQuery).toHaveBeenCalledWith('(max-width: 767px)');
    });

    it('returns false when viewport is 768px or above', () => {
      mockUseMediaQuery.mockReturnValue(false);
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsTablet', () => {
    it('returns true when viewport is between 768px and 1279px', () => {
      mockUseMediaQuery.mockReturnValue(true);
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
      expect(mockUseMediaQuery).toHaveBeenCalledWith(
        '(min-width: 768px) and (max-width: 1279px)'
      );
    });

    it('returns false when viewport is below 768px', () => {
      mockUseMediaQuery.mockReturnValue(false);
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsDesktop', () => {
    it('returns true when viewport is 1280px or above', () => {
      mockUseMediaQuery.mockReturnValue(true);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
      expect(mockUseMediaQuery).toHaveBeenCalledWith('(min-width: 1280px)');
    });

    it('returns false when viewport is below 1280px', () => {
      mockUseMediaQuery.mockReturnValue(false);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });
  });

  describe('useDeviceType', () => {
    it('returns "mobile" on small screens', () => {
      // mobile = true, tablet = false
      mockUseMediaQuery
        .mockReturnValueOnce(true) // isMobile
        .mockReturnValueOnce(false); // isTablet
      const { result } = renderHook(() => useDeviceType());
      expect(result.current).toBe('mobile');
    });

    it('returns "tablet" on medium screens', () => {
      mockUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(true); // isTablet
      const { result } = renderHook(() => useDeviceType());
      expect(result.current).toBe('tablet');
    });

    it('returns "desktop" on large screens', () => {
      mockUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(false); // isTablet
      const { result } = renderHook(() => useDeviceType());
      expect(result.current).toBe('desktop');
    });
  });
});
