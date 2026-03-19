"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook to manage user-scoped presets stored in localStorage.
 * Key is namespaced by userId to keep presets per-user.
 *
 * @param category - preset category (e.g. "title", "description")
 * @param userId  - current user's ID (optional, falls back to "anonymous")
 */
export function useLocalPresets(category: string, userId?: string | null) {
  const storageKey = `presets_${category}_${userId || "anonymous"}`;

  const [presets, setPresets] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch {
      console.error(`Failed to load presets for key: ${storageKey}`);
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: string[]) => {
      setPresets(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey],
  );

  const addPreset = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      setPresets((prev) => {
        if (prev.includes(trimmed)) return prev; // no duplicates
        const next = [...prev, trimmed];
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey],
  );

  const updatePreset = useCallback(
    (oldValue: string, newValue: string) => {
      const trimmed = newValue.trim();
      if (!trimmed) return;
      setPresets((prev) => {
        const next = prev.map((p) => (p === oldValue ? trimmed : p));
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey],
  );

  const removePreset = useCallback(
    (value: string) => {
      setPresets((prev) => {
        const next = prev.filter((p) => p !== value);
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey],
  );

  return { presets, addPreset, updatePreset, removePreset, persist };
}
