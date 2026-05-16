
import { useState } from "react";

import {
  Routes,
  Route
} from "react-router-dom";

import Banner from "./components/Banner";
import Navbar from "./components/Navbar";

import DexEntriesPage from "./pages/DexEntriesPage";
import LearnsetsPage from "./pages/LearnsetsPage";

import MoveDetailPage from "./pages/MoveDetailPage";
import PokemonDetailPage from "./pages/PokemonDetailPage";
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

      <Routes>
        <Route
          path="/"
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