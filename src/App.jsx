
import {
  lazy,
  Suspense,
  useState
} from "react";

import {
  useLocation,
  Routes,
  Route
} from "react-router-dom";

import Banner from "./components/Banner";
import Navbar from "./components/Navbar";

import ScrollToTop from "./components/ScrollToTop";
import "./App.css";

const DexEntriesPage = lazy(() =>
  import("./pages/DexEntriesPage")
);
const LearnsetsPage = lazy(() =>
  import("./pages/LearnsetsPage")
);
const HomePage = lazy(() =>
  import("./pages/HomePage")
);
const MovesPage = lazy(() =>
  import("./pages/MovesPage")
);
const MoveDetailPage = lazy(() =>
  import("./pages/MoveDetailPage")
);
const PokemonDetailPage = lazy(() =>
  import("./pages/PokemonDetailPage")
);
const AbilitiesPage = lazy(() =>
  import("./pages/AbilitiesPage")
);
const AbilityDetailPage = lazy(() =>
  import("./pages/AbilityDetailPage")
);
const TypeDetailPage = lazy(() =>
  import("./pages/TypeDetailPage")
);
const TypesPage = lazy(() =>
  import("./pages/TypesPage")
);
const ItemsPage = lazy(() =>
  import("./pages/ItemsPage")
);
const DynamaxCrystalsGuidePage = lazy(() =>
  import("./pages/DynamaxCrystalsGuidePage")
);
const ItemDetailPage = lazy(() =>
  import("./pages/ItemDetailPage")
);
const LocationsPage = lazy(() =>
  import("./pages/LocationsPage")
);
const LocationDetailPage = lazy(() =>
  import("./pages/LocationDetailPage")
);
const TopicsPage = lazy(() =>
  import("./pages/TopicsPage")
);
const TopicDetailPage = lazy(() =>
  import("./pages/TopicDetailPage")
);
const TeamCoveragePage = lazy(() =>
  import("./pages/TeamCoveragePage")
);
const SingleTypeCoveragePage = lazy(() =>
  import("./pages/SingleTypeCoveragePage")
);
const OgPreviewHome = lazy(() =>
  import("./og/OgPreviewPage").then(module => ({
    default: module.OgPreviewHome
  }))
);
const OgPokemonPreview = lazy(() =>
  import("./og/OgPreviewPage").then(module => ({
    default: module.OgPokemonPreview
  }))
);
const OgMovePreview = lazy(() =>
  import("./og/OgPreviewPage").then(module => ({
    default: module.OgMovePreview
  }))
);
const OgTopicPreview = lazy(() =>
  import("./og/OgPreviewPage").then(module => ({
    default: module.OgTopicPreview
  }))
);
const OgItemPreview = lazy(() =>
  import("./og/OgPreviewPage").then(module => ({
    default: module.OgItemPreview
  }))
);

function RouteLoadingFallback() {
  return (
    <main
      aria-label="Loading page"
      style={{
        minHeight: "55vh",
        padding: "2rem 1rem"
      }}
    />
  );
}

function App() {
  const location = useLocation();
  const isOgPreviewRoute =
    location.pathname.startsWith(
      "/og-preview"
    );
  const [
    selectedMove,
    setSelectedMove
  ] = useState(null);

  return (
    <>
      {!isOgPreviewRoute && (
        <Banner />
      )}

      {!isOgPreviewRoute && (
        <Navbar />
      )}



  {!isOgPreviewRoute && (
    <ScrollToTop />
  )}

      <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>



<Route
  path="/"
  element={<HomePage />}
/>


<Route
  path="/ability/:abilityName"
  element={<AbilityDetailPage />}
/>


<Route
  path="/abilities"
  element={<AbilitiesPage />}
/>

<Route
  path="/moves"
  element={<MovesPage />}
/>

<Route
  path="/items"
  element={<ItemsPage />}
/>

<Route
  path="/items/dynamax-crystals"
  element={<DynamaxCrystalsGuidePage />}
/>

<Route
  path="/item/:itemName"
  element={<ItemDetailPage />}
/>

<Route
  path="/locations"
  element={<LocationsPage />}
/>

<Route
  path="/topics"
  element={<TopicsPage />}
/>

<Route
  path="/topic/:topicSlug"
  element={<TopicDetailPage />}
/>

<Route
  path="/og-preview"
  element={<OgPreviewHome />}
/>

<Route
  path="/og-preview/pokemon/:id"
  element={<OgPokemonPreview />}
/>

<Route
  path="/og-preview/move/:moveName"
  element={<OgMovePreview />}
/>

<Route
  path="/og-preview/topic/:topicSlug"
  element={<OgTopicPreview />}
/>

<Route
  path="/og-preview/item/:itemName"
  element={<OgItemPreview />}
/>

<Route
  path="/location/:locationName"
  element={<LocationDetailPage />}
/>

<Route
  path="/type/:typeName"
  element={<TypeDetailPage />}
/>

<Route
  path="/types"
  element={<TypesPage />}
/>

<Route
  path="/team-coverage"
  element={<TeamCoveragePage />}
/>

<Route
  path="/single-type-coverage"
  element={<SingleTypeCoveragePage />}
/>

        <Route
          path="/DexEntries"
          element={
            <DexEntriesPage />
          }
        />

        <Route
          path="/dex-entries"
          element={
            <DexEntriesPage />
          }
        />

        <Route
          path="/learnsets"
          element={
            <LearnsetsPage
              setSelectedMove={
                setSelectedMove
              }
            />
          }
        />

        <Route
        path="/pokemon/:identifier"
        element={<PokemonDetailPage />}
          />

        <Route
           path="/move/:moveName"
            element={<MoveDetailPage />}
        />

      </Routes>
      </Suspense>

      {selectedMove ? (
        <Suspense fallback={null}>
          <MoveDetailPage
            moveName={
              selectedMove
            }
            setSelectedMove={
              setSelectedMove
            }
          />
        </Suspense>
      ) : (
        <div></div>
      )}
    </>
  );
}

export default App;
