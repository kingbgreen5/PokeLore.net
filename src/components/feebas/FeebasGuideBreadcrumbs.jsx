import { Link } from "react-router-dom";
import { getFeebasGuideBreadcrumbs } from "./feebasGuideBreadcrumbData";
import "./FeebasGuideBreadcrumbs.css";

function FeebasGuideBreadcrumbs({
  pageId
}) {
  const breadcrumbs = getFeebasGuideBreadcrumbs(pageId);

  if (!breadcrumbs) {
    return null;
  }

  return (
    <nav
      aria-label="Feebas guide breadcrumbs"
      className="feebas-guide-breadcrumbs"
    >
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <span
            className="feebas-guide-breadcrumb-item"
            key={`${breadcrumb.label}-${index}`}
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className="feebas-guide-breadcrumb-separator"
              >
                /
              </span>
            )}
            {breadcrumb.to && !isLast ? (
              <Link to={breadcrumb.to}>
                {breadcrumb.label}
              </Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined}>
                {breadcrumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default FeebasGuideBreadcrumbs;
