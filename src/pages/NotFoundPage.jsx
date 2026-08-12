import { Link } from "react-router-dom";
import Seo from "../seo/Seo";

function NotFoundPage({
  title = "Page not found",
  message = "This page is not available on PokeLore.",
  returnTo = "/",
  returnLabel = "Back to Pokedex"
}) {
  return (
    <main
      style={{
        padding: "2rem"
      }}
    >
      <Seo
        title={`${title} | PokeLore`}
        description={message}
        robots="noindex, follow"
      />
      <h1>{title}</h1>
      <p>
        {message}
      </p>
      <p
        style={{
          marginTop: "1rem"
        }}
      >
        <Link to={returnTo}>
          {returnLabel}
        </Link>
      </p>
    </main>
  );
}

export default NotFoundPage;
