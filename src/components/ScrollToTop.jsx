import { useEffect }
from "react";

import {
  useLocation,
  useNavigationType
}
from "react-router-dom";

function ScrollToTop() {

  const location =
    useLocation();
  const { pathname } =
    location;
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

    if (
      location.state?.preserveScroll
    ) {
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "auto"
    });

  }, [
    location.state,
    navigationType,
    pathname
  ]);

  return null;
}

export default ScrollToTop;
