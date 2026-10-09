// Deliberately wraps the frozen production implementation instead of copying
// calculator semantics into Astro. BrowserRouter supplies the URL APIs the
// calculator uses for its own query state. Links that leave this island must
// opt into document navigation, because Astro owns the destination pages.
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import TeamCoveragePage from '../../../src/pages/TeamCoveragePage.jsx';

export default function TeamCoverageTool() {
  useEffect(() => {
    document.body.dataset.teamCoverageMounted = 'true';
    return () => { delete document.body.dataset.teamCoverageMounted; };
  }, []);
  return <BrowserRouter><TeamCoveragePage /></BrowserRouter>;
}
