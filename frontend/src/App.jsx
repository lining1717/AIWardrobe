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
      <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
        {/* Soft decorative glows — warm rose / champagne / sage */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div
            className="absolute -left-32 -top-24 h-96 w-96 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--accent-rose), transparent 70%)' }}
          />
          <div
            className="absolute -right-40 top-1/3 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--accent-champagne), transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--accent-sage), transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-screen-2xl pb-24 lg:pb-8 lg:pt-20 lg:px-6">
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
