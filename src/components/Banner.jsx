
import { useNavigate }
from "react-router-dom";

import bannerImage
from "../assets/Banner.png";

function Banner() {

  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/")}
      style={{
        padding: ".5rem",
        cursor: "pointer",
        textAlign: "center"


        
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


    </div>
  );
}

export default Banner;
