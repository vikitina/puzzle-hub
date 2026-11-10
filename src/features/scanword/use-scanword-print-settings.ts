import { useEffect, useState } from 'react';
export const SCANWORD_PRINT_STORAGE = 'puzzle-workshop-scanword-print-v1';
export function useScanwordPrintSettings() {
  const [cellMm, setCellMm] = useState(() => {
    try {
      const raw = localStorage.getItem(SCANWORD_PRINT_STORAGE);
      const value: unknown = raw ? JSON.parse(raw) : 18;
      return typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= 12 &&
        value <= 24
        ? value
        : 18;
    } catch {
      return 18;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(SCANWORD_PRINT_STORAGE, JSON.stringify(cellMm));
    } catch {
      /* Screen and file export still work. */
    }
  }, [cellMm]);
  return {
    cellMm,
    setCellMm: (value: number) => {
      if (Number.isInteger(value) && value >= 12 && value <= 24)
        setCellMm(value);
    },
  };
}