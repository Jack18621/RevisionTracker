import dayjs from 'dayjs'
import { useStore } from '../store'

export default function History(){
  const sessions = useStore(s=> s.sessions)
  const total = sessions.reduce((acc, s)=>{
    if(!s.endISO) return acc
    const mins = Math.max(0, dayjs(s.endISO).diff(dayjs(s.startISO),'minute'))
    return acc+mins
  },0)
  return (
    <div className="bg-card rounded-xl2 p-4 shadow-soft border border-edge">
      <div className="flex items-center justify-between">
        <div className="font-medium">Study History</div>
        <div className="text-sub text-sm">Total: {Math.floor(total/60)}h {total%60}m</div>
      </div>
      <div className="mt-3 divide-y divide-edge">
        {sessions.slice().reverse().map((s,i)=>{
          const mins = s.endISO ? Math.max(0, dayjs(s.endISO).diff(dayjs(s.startISO),'minute')) : null
          return (
            <div key={i} className="py-2 flex items-center justify-between">
              <div className="text-sm">{dayjs(s.startISO).format('YYYY-MM-DD HH:mm')}</div>
              <div className="opacity-80">{s.subject_id}</div>
              <div className="text-sub text-sm">{mins!==null ? `${mins} min` : '(running)'}</div>
            </div>
          )
        })}
        {sessions.length===0 && <div className="py-6 text-sub">No sessions yet.</div>}
      </div>
    </div>
  )
}
