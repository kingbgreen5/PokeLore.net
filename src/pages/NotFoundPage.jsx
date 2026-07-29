import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main
      style={{
        padding: "2rem"
      }}
    >
      <h1>Page not found</h1>
      <p>
        This page is not available on PokeLore.
      </p>
      <p
        style={{
          marginTop: "1rem"
        }}
      >
        <Link to="/topics">Back to topics</Link>
      </p>
    </main>
  );
}

export default NotFoundPage;
