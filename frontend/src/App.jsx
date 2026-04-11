import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Entry from './pages/Entry'
import Wardrobe from './pages/Wardrobe'
import ClothesDetail from './pages/ClothesDetail'
import Outfit from './pages/Outfit'
import Recommendation from './pages/Recommendation'
import TabBar from './components/TabBar'
import './index.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative">
        <div className="mx-auto w-full max-w-screen-2xl pb-24 lg:pb-8 lg:pt-20 lg:px-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/entry" element={<Entry />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/clothes/:id" element={<ClothesDetail />} />
            <Route path="/outfit" element={<Outfit />} />
            <Route path="/recommendation" element={<Recommendation />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <TabBar />
      </div>
    </Router>
  )
}

export default App
