import { useEffect, useRef } from "react";

export default function useAutosave(data, onSave, delay = 800) {
  const timeoutRef = useRef(null);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      onSaveRef.current(data);
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [data, delay]);
}
