import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import DocumentPage from './pages/DocumentPage'
import LibraryPage from './pages/LibraryPage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/document/:id" element={<DocumentPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
