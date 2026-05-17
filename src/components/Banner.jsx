
// function Banner() {
//   return (
// <div 


// style={{ padding: "2rem" }} >


//   <div>
//     <img
//       src="/src/assets/Banner.png"
//       alt="Banner"
//       style={{ width: "80%", height: "80%" }}
//     />
//   </div>

  
//              <h3>Searchable Pokédex Entry Archive</h3>
//              <h5>Search every entry from every generation.</h5>
// {/* 
//                <div>
//     <img
//       src="/src/assets/Tyranitar.png"
//       alt="Tyranitar"
//       style={{ width: "50px", height: "50px" }}
//     />
//   </div> */}
//     </div>

//   );
// }

// export default Banner;



// import { useNavigate }
// from "react-router-dom";

// function Banner() {

//   const navigate = useNavigate();

//   return (
//     <div
//       onClick={() => navigate("/")}
//       style={{
//         padding: "2rem",
//         cursor: "pointer",
//         textAlign: "center"
//       }}
//     >
//       {/* Banner Image */}

//       <div>
//         <img
//           src="/src/assets/Banner.png"
//           alt="Banner"
//           style={{
//             width: "80%",
//             height: "80%",
//             maxWidth: "900px"
//           }}
//         />
//       </div>

//       {/* Subtitle */}

//       <h3>
//         Searchable Pokédex Entry
//         Archive
//       </h3>

//       <h5>
//         Search every entry from
//         every generation.
//       </h5>
//     </div>
//   );
// }

// export default Banner;













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
        padding: "2rem",
        cursor: "pointer",
        textAlign: "center"


        
      }}
    >
      <div>
        <img
          src={bannerImage}
          alt="Banner"
          style={{
            width: "80%",
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

      <h3>
        Searchable Pokédex Entry
        Archive
      </h3>

      <h5>
        Search every entry from
        every generation.
      </h5>
    </div>
  );
}

export default Banner;
