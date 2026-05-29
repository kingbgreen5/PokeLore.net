
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
import MoveDetailPage from "./pages/MoveDetailPage";
import PokemonDetailPage from "./pages/PokemonDetailPage";
import AbilityDetailPage from "./pages/AbilityDetailPage";
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
          path="/DexEntries"
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