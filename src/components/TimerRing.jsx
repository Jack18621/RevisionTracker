import { motion } from 'framer-motion'
const CIRC = 2 * Math.PI * 100

export default function TimerRing({seconds=0, goalMinutes=0}){
  const pct = goalMinutes>0 ? Math.min(1, (seconds/60)/goalMinutes) : 0
  const dash = CIRC * pct
  const rest = CIRC - dash
  const h = Math.floor(seconds/3600)
  const m = Math.floor((seconds%3600)/60)
  const s = seconds%60
  const text = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`

  return (
    <div className="relative w-64 h-64 grid place-items-center">
      <svg viewBox="-120 -120 240 240" className="w-64 h-64 drop-shadow">
        <circle r="100" cx="0" cy="0" fill="none" stroke="#253142" strokeWidth="16" strokeLinecap="round"/>
        <motion.circle r="100" cx="0" cy="0" fill="none" stroke="#3b82f6" strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${dash} ${rest}`} transform="rotate(-90)"
          initial={{ strokeDasharray: `0 ${CIRC}`}} animate={{ strokeDasharray: `${dash} ${rest}`}} transition={{ duration: .2 }}/>
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-semibold">{text}</div>
        <div className="text-sub">{goalMinutes>0 ? `${Math.floor(seconds/60)}/${goalMinutes} min`: 'No goal set'}</div>
      </div>
    </div>
  )
}
