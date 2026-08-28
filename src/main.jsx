import './index.css'
import App from './App.jsx'
import {
  createRoot,
  hydrateRoot
} from "react-dom/client";
import {
  BrowserRouter
} from "react-router-dom";

const rootElement =
  document.getElementById("root");
const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

const shouldHydratePrerender =
  rootElement.dataset.pokeloreReactPrerender &&
  window.location.pathname ===
    "/ev-training-routes" &&
  window.location.search === "";

if (shouldHydratePrerender) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
