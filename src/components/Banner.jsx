
import { Link }
from "react-router-dom";

import bannerImage
from "../assets/Banner.png";

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
        <img
          src={bannerImage}
          alt="Banner"
          style={{
            width: "90%",
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
      </div>


    </Link>
  );
}

export default Banner;
