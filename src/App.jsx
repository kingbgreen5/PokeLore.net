import { useState } from 'react'
import DexEntriesPage from "./pages/DexEntriesPage";
import Banner from "./components/Banner";
import Navbar from "./components/Navbar";
import './App.css'
import LearnsetsPage from './pages/LearnsetsPage';


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

      {page === "learnsets" && <LearnsetsPage    setSelectedMove={setSelectedMove}/>}
 
{selectedMove ? (
  <MoveDetailPage
    moveName={selectedMove}
    setSelectedMove={setSelectedMove}
  />
) : (

  <div></div>
)}




    </>
  )
}

export default App
