import { useState } from 'react'
import DexEntriesPage from "./pages/DexEntriesPage";
import Banner from "./components/Banner";
import Navbar from "./components/Navbar";
import MovesPage from "./pages/LearnsetsPage";
import './App.css'


// visit http://localhost:5173/ to see the app in action

function App() {
   const [page, setPage] = useState("dex");

const [selectedMove, setSelectedMove] =
  useState(null);

  return (
    <>

          <Banner />

 <Navbar setPage={setPage} />

      {page === "dex" && <DexEntriesPage />}

      {page === "moves" && <MovesPage />}
 
{selectedMove ? (
  <MoveDetailPage
    moveName={selectedMove}
    setSelectedMove={setSelectedMove}
  />
) : (
  <MovesPage
    setSelectedMove={setSelectedMove}
  />
)}




    </>
  )
}

export default App
