import { useEffect, useState } from 'react';
export default function useSessionState(key, initial) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => { try { const raw = sessionStorage.getItem(key); if (raw !== null) setValue(JSON.parse(raw)); } catch {} setReady(true); }, [key]);
  useEffect(() => { if (ready) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {} } }, [key, value, ready]);
  return [value, setValue];
}
