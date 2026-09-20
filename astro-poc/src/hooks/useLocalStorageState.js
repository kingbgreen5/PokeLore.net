import { useEffect, useState } from 'react';
export default function useLocalStorageState(key, initial) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw !== null) setValue(JSON.parse(raw)); } catch {}
    setReady(true);
    const sync = event => { if (event.key === key) { try { setValue(event.newValue === null ? initial : JSON.parse(event.newValue)); } catch {} } };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key]);
  useEffect(() => { if (ready) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} } }, [key, value, ready]);
  return [value, setValue];
}
