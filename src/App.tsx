import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import StudySession from './pages/StudySession'
import Progress from './pages/Progress'
import WordList from './pages/WordList'
import Layout from './components/Layout'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/study/:type" element={<StudySession />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/words" element={<WordList />} />
      </Routes>
    </Layout>
  )
}

export default App
