import { useEffect }
from "react";

import {
  useLocation,
  useNavigationType
}
from "react-router-dom";

function ScrollToTop() {

  const { pathname } =
    useLocation();
  const navigationType =
    useNavigationType();

  useEffect(() => {
    if (
      "scrollRestoration" in
      window.history
    ) {
      window.history.scrollRestoration =
        "manual";
    }
  }, []);

  useEffect(() => {
    if (navigationType === "POP") {
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "auto"
    });

  }, [
    navigationType,
    pathname
  ]);

  return null;
}

export default ScrollToTop;
