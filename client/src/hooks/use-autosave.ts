import { useCallback, useEffect, useRef, useState } from "react";

type UseAutosaveOptions = {
  debounceMs?: number;
  enabled?: boolean;
};

function getChangedKeys(previous: unknown, next: unknown): string[] {
  if (
    typeof previous !== "object" ||
    previous === null ||
    typeof next !== "object" ||
    next === null
  ) {
    return [];
  }

  const prevObj = previous as Record<string, unknown>;
  const nextObj = next as Record<string, unknown>;
  const keys = Array.from(
    new Set([...Object.keys(prevObj), ...Object.keys(nextObj)]),
  );
  const changed: string[] = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (JSON.stringify(prevObj[key]) !== JSON.stringify(nextObj[key])) {
      changed.push(key);
    }
  }

  return changed;
}

/**
 * Debounced autosave for edit forms.
 * Skips the initial mount value, saves after inactivity, and exposes
 * briefly-visible field keys for inline ✓ indicators.
 */
export function useAutosave<T>(
  value: T,
  saveFn: (value: T) => Promise<void>,
  options: UseAutosaveOptions = {},
) {
  const { debounceMs = 800, enabled = true } = options;
  const [isSaving, setIsSaving] = useState(false);
  const [savedFields, setSavedFields] = useState<Set<string>>(() => new Set());
  /** Bumps when a save finishes while newer edits are pending, to re-debounce. */
  const [retryToken, setRetryToken] = useState(0);

  const pendingFieldsRef = useRef<Set<string>>(new Set());
  const lastSavedSerializedRef = useRef<string | null>(null);
  const lastSavedValueRef = useRef<T>(value);
  const valueRef = useRef(value);
  const saveFnRef = useRef(saveFn);
  const clearSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  valueRef.current = value;
  saveFnRef.current = saveFn;

  const serializedValue = JSON.stringify(value);

  const markChanged = useCallback((field: string) => {
    pendingFieldsRef.current.add(field);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Capture baseline without saving on first run / when enabled flips on.
    if (lastSavedSerializedRef.current === null) {
      lastSavedSerializedRef.current = serializedValue;
      lastSavedValueRef.current = valueRef.current;
      pendingFieldsRef.current.clear();
      return;
    }

    if (serializedValue === lastSavedSerializedRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      if (isSavingRef.current) {
        // A save is in flight; when it finishes it will bump retryToken if still dirty.
        return;
      }

      const currentValue = valueRef.current;
      const currentSerialized = JSON.stringify(currentValue);
      if (currentSerialized === lastSavedSerializedRef.current) {
        return;
      }

      let fieldsToShow = new Set(pendingFieldsRef.current);
      if (fieldsToShow.size === 0) {
        fieldsToShow = new Set(
          getChangedKeys(lastSavedValueRef.current, currentValue),
        );
      }

      isSavingRef.current = true;
      setIsSaving(true);
      try {
        await saveFnRef.current(currentValue);
        lastSavedSerializedRef.current = currentSerialized;
        lastSavedValueRef.current = currentValue;
        pendingFieldsRef.current.clear();

        if (clearSavedTimerRef.current) {
          clearTimeout(clearSavedTimerRef.current);
        }
        setSavedFields(fieldsToShow);
        clearSavedTimerRef.current = setTimeout(() => {
          setSavedFields(new Set());
          clearSavedTimerRef.current = null;
        }, 2000);
      } catch {
        // Callers surface errors (e.g. mutation onError toasts).
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
        const latestSerialized = JSON.stringify(valueRef.current);
        if (latestSerialized !== lastSavedSerializedRef.current) {
          setRetryToken((token) => token + 1);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [serializedValue, debounceMs, enabled, retryToken]);

  useEffect(() => {
    return () => {
      if (clearSavedTimerRef.current) {
        clearTimeout(clearSavedTimerRef.current);
      }
    };
  }, []);

  // Reset baseline when autosave is disabled (e.g. while initial data loads).
  useEffect(() => {
    if (!enabled) {
      lastSavedSerializedRef.current = null;
      pendingFieldsRef.current.clear();
    }
  }, [enabled]);

  return { savedFields, isSaving, markChanged };
}
