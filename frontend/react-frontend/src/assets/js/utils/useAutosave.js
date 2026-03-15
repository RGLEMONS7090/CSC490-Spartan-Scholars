import { useEffect, useRef } from "react";

export default function useAutosave(data, onSave, delay = 800) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      onSave(data);
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [data, delay]);
}