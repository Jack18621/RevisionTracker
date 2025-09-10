import { Routes, Route, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import Dashboard from './pages/Dashboard.jsx'
import Focus from './pages/Focus.jsx'
import History from './pages/History.jsx'
import Settings from './pages/Settings.jsx'

const LinkBtn = ({to, children}) => (
  <NavLink to={to} className={({isActive}) => 'px-4 py-2 rounded-xl2 ' + (isActive ? 'bg-[#18202b]' : 'bg-card hover:bg-[#141c26]')}>
    {children}
  </NavLink>
)

export default function App(){
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur border-b border-edge">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
          <div className="font-semibold">Revision Tracker</div>
          <nav className="flex gap-2">
            <LinkBtn to="/">Home</LinkBtn>
            <LinkBtn to="/focus">Focus</LinkBtn>
            <LinkBtn to="/history">History</LinkBtn>
            <LinkBtn to="/settings">Settings</LinkBtn>
          </nav>
        </div>
      </header>
      <motion.main className="max-w-6xl mx-auto p-4 space-y-4"
        initial={{ opacity: 0, y: 12}} animate={{opacity:1, y:0}} transition={{duration: .35}}>
        <Routes>
          <Route path="/" element={<Dashboard/>}/>
          <Route path="/focus" element={<Focus/>}/>
          <Route path="/history" element={<History/>}/>
          <Route path="/settings" element={<Settings/>}/>
        </Routes>
      </motion.main>
      <footer className="max-w-6xl mx-auto p-6 text-sub text-sm opacity-70">Built for smooth study ✨</footer>
    </div>
  )
}
