import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('formats ARS currency', () => {
      const result = formatCurrency(1500);
      expect(result).toContain('1.500');
    });

    it('formats zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('formats large numbers', () => {
      const result = formatCurrency(150000);
      expect(result).toContain('150.000');
    });
  });

  describe('formatDate', () => {
    it('formats a valid date string', () => {
      const result = formatDate('2026-01-15');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('formats a Date object', () => {
      const result = formatDate(new Date('2026-06-15'));
      expect(result).toBeTruthy();
    });
  });

  describe('formatDateTime', () => {
    it('formats a valid datetime string', () => {
      const result = formatDateTime('2026-01-15T10:30:00Z');
      expect(result).toBeTruthy();
    });
  });
});
