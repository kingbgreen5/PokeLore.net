
import { useState } from "react";

import {
  Routes,
  Route
} from "react-router-dom";

import Banner from "./components/Banner";
import Navbar from "./components/Navbar";

import DexEntriesPage from "./pages/DexEntriesPage";
import LearnsetsPage from "./pages/LearnsetsPage";
import HomePage from "./pages/HomePage";
import MovesPage from "./pages/MovesPage";
import MoveDetailPage from "./pages/MoveDetailPage";
import PokemonDetailPage from "./pages/PokemonDetailPage";
import AbilitiesPage from "./pages/AbilitiesPage";
import AbilityDetailPage from "./pages/AbilityDetailPage";
import TypeDetailPage from "./pages/TypeDetailPage";
import TypesPage from "./pages/TypesPage";
import ItemsPage from "./pages/ItemsPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import LocationsPage from "./pages/LocationsPage";
import LocationDetailPage from "./pages/LocationDetailPage";



import ScrollToTop from "./components/ScrollToTop";
import "./App.css";

function App() {
  const [
    selectedMove,
    setSelectedMove
  ] = useState(null);

  return (
    <>
      <Banner />

      <Navbar />



  <ScrollToTop />

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
  path="/item/:itemName"
  element={<ItemDetailPage />}
/>

<Route
  path="/locations"
  element={<LocationsPage />}
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
        path="/pokemon/:id"
        element={<PokemonDetailPage />}
          />

        <Route
           path="/move/:moveName"
            element={<MoveDetailPage />}
        />

      </Routes>

      {selectedMove ? (
        <MoveDetailPage
          moveName={
            selectedMove
          }
          setSelectedMove={
            setSelectedMove
          }
        />
      ) : (
        <div></div>
      )}
    </>
  );
}

export default App;
