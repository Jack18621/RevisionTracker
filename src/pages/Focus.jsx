import { useEffect, useState } from 'react'
import { useStore } from '../store'
import TimerRing from '../components/TimerRing.jsx'

export default function Focus(){
  const subjects = useStore(s=> s.subjects)
  const start = useStore(s=> s.addSessionStart)
  const stop = useStore(s=> s.endRunningSession)
  const daily = useStore(s=> s.settings.dailyTargetMin)
  const [goal, setGoal] = useState(daily)
  const [seconds, setSeconds] = useState(0)
  const [subject, setSubject] = useState(subjects[0]?.id || 'maths')
  const [running, setRunning] = useState(false)

  useEffect(()=>{
    let id;
    if(running){
      id = setInterval(()=> setSeconds(s=> s+1), 1000)
    }
    return ()=> id && clearInterval(id)
  },[running])

  function handleStart(){
    start(subject); setSeconds(0); setRunning(true)
  }
  function handlePause(){
    setRunning(false); stop()
  }
  function handleStop(){
    setRunning(false); stop()
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      <div className="bg-card rounded-xl2 p-6 shadow-soft border border-edge grid place-items-center">
        <TimerRing seconds={seconds} goalMinutes={goal}/>
      </div>
      <div className="bg-card rounded-xl2 p-6 shadow-soft border border-edge space-y-3">
        <div className="text-sub">Focus Mode</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm opacity-80">Subject
            <select className="mt-1 w-full bg-[#0f151d] border border-edge rounded-xl2 p-2"
              value={subject} onChange={e=> setSubject(e.target.value)}>
              {subjects.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="text-sm opacity-80">Session goal (min)
            <input type="number" className="mt-1 w-full bg-[#0f151d] border border-edge rounded-xl2 p-2"
              value={goal} onChange={e=> setGoal(parseInt(e.target.value||'0'))}/>
          </label>
        </div>
        <div className="flex gap-2 pt-2">
          {!running ? <button onClick={handleStart} className="px-4 py-2 rounded-xl2 bg-brand">Start</button>
          : <button onClick={handlePause} className="px-4 py-2 rounded-xl2 bg-[#121a23] border border-edge">Pause</button>}
          <button onClick={handleStop} className="px-4 py-2 rounded-xl2 bg-[#121a23] border border-edge">Stop</button>
        </div>
        <div className="text-sub text-sm">Tip: keep this tab open while revising; it logs your session.</div>
      </div>
    </div>
  )
}
