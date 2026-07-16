import {
  useEffect,
  useRef,
  useState
} from "react";

function DeferredSection({
  children,
  fallback = null,
  onReveal,
  rootMargin = "600px 0px"
}) {
  const containerRef = useRef(null);
  const [revealed, setRevealed] =
    useState(false);

  useEffect(() => {
    if (revealed) {
      return undefined;
    }

    const element = containerRef.current;

    if (
      !element ||
      typeof IntersectionObserver ===
        "undefined"
    ) {
      const timeoutId = window.setTimeout(
        () => setRevealed(true),
        1200
      );

      return () =>
        window.clearTimeout(timeoutId);
    }

    const observer =
      new IntersectionObserver(
        entries => {
          if (
            entries.some(
              entry => entry.isIntersecting
            )
          ) {
            setRevealed(true);
          }
        },
        {
          rootMargin
        }
      );

    observer.observe(element);

    return () => observer.disconnect();
  }, [
    revealed,
    rootMargin
  ]);

  useEffect(() => {
    if (revealed) {
      onReveal?.();
    }
  }, [
    onReveal,
    revealed
  ]);

  return (
    <div ref={containerRef}>
      {revealed ? children : fallback}
    </div>
  );
}

export default DeferredSection;
