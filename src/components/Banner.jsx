
import { Link } from "react-router-dom";

import bannerFallback from "../assets/Banner-900.png";
import banner360 from "../assets/Banner-360.webp";
import banner640 from "../assets/Banner-640.webp";
import banner900 from "../assets/Banner-900.webp";

function Banner() {
  return (
    <Link
      to="/"
      style={{
        display: "block",

        paddingTop: "1.25rem",
        cursor: "pointer",
        textAlign: "center",
        textDecoration: "none"
      }}
    >
      <div>
        <picture>
          <source
            type="image/webp"
            srcSet={`${banner360} 360w, ${banner640} 640w, ${banner900} 900w`}
            sizes="(max-width: 720px) 90vw, 900px"
          />
          <img
            src={bannerFallback}
            alt="Banner"
            width="900"
            height="224"
            decoding="async"
            style={{
              width: "90%",
              height: "auto",
              maxWidth: "900px",
              transition: "transform 0.15s ease"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform =
                "scale(1.01)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform =
                "scale(1)";
            }}
          />
        </picture>
      </div>
    </Link>
  );
}

export default Banner;
