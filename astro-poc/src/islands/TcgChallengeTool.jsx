// Astro boundary for the frozen production game. BrowserRouter supplies the
// same location/navigation APIs used by the Vite route; pack logic stays in
// the production source rather than being copied into this island.
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import TcgChallengePage from '../../../src/pages/TcgChallengePage.jsx';

export default function TcgChallengeTool() {
  useEffect(() => {
    document.body.dataset.tcgChallengeMounted = 'true';
    return () => { delete document.body.dataset.tcgChallengeMounted; };
  }, []);
  return <BrowserRouter><TcgChallengePage /></BrowserRouter>;
}
