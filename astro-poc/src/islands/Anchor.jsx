import { publicHref } from '../lib/links.js';
// Compatibility at component boundaries only: this always renders a real anchor.
export function Anchor({ to, state, children, ...props }) {
  return <a {...props} href={publicHref(to)}>{children}</a>;
}
