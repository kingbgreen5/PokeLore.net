import {
  useEffect,
  useMemo
} from "react";
import {
  useLocation,
  useNavigationType
} from "react-router-dom";

function usePersistedScroll(
  key,
  enabled = true
) {
  const location =
    useLocation();
  const navigationType =
    useNavigationType();

  const storageKey = useMemo(
    () =>
      `scroll:${
        key ??
        `${location.pathname}${location.search}`
      }`,
    [
      key,
      location.pathname,
      location.search
    ]
  );

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (navigationType === "POP") {
      const savedScroll =
        sessionStorage.getItem(
          storageKey
        );

      if (savedScroll) {
        const scrollY =
          Number(savedScroll);

        requestAnimationFrame(() => {
          window.scrollTo(
            0,
            scrollY
          );

          requestAnimationFrame(() => {
            window.scrollTo(
              0,
              scrollY
            );
          });
        });
      }
    }

    let frameId = null;

    function writeScroll() {
      sessionStorage.setItem(
        storageKey,
        String(window.scrollY)
      );

      frameId = null;
    }

    function saveScroll() {
      if (frameId !== null) {
        return;
      }

      frameId =
        requestAnimationFrame(
          writeScroll
        );
    }

    function saveScrollImmediately() {
      sessionStorage.setItem(
        storageKey,
        String(window.scrollY)
      );
    }

    window.addEventListener(
      "scroll",
      saveScroll,
      { passive: true }
    );

    window.addEventListener(
      "beforeunload",
      saveScrollImmediately
    );

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(
          frameId
        );
      }

      sessionStorage.setItem(
        storageKey,
        String(window.scrollY)
      );

      window.removeEventListener(
        "scroll",
        saveScroll
      );

      window.removeEventListener(
        "beforeunload",
        saveScrollImmediately
      );
    };
  }, [
    enabled,
    navigationType,
    storageKey
  ]);
}

export default usePersistedScroll;
