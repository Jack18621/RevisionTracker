import dayjs from 'dayjs'
import { useStore } from '../store'

export default function StreakHeatstrip(){
  const includeWeekends = useStore(s=> s.settings.includeWeekends)
  const target = useStore(s=> s.settings.dailyTargetMin)
  const streak = useStore(s=> s.streak)
  const minutesPerDay = useStore(s=> s.minutesPerDay)

  const { rangeStart, rangeEnd } = useStore(s=> s.settings)
  const days = minutesPerDay()
  let arr = []
  let d = dayjs(rangeEnd)
  const start = dayjs(rangeStart)
  for(let i=0;i<60;i++){
    if(d.isBefore(start)) arr.push(false)
    else {
      if(!includeWeekends && (d.day()===0||d.day()===6)) arr.push(false)
      else {
        const k = d.format('YYYY-MM-DD')
        const total = Object.values(days[k]||{}).reduce((a,b)=>a+b,0)
        arr.push(total >= target)
      }
    }
    d = d.subtract(1,'day')
  }
  arr = arr.reverse()

  return (
    <div className="flex gap-1">
      {arr.map((ok,i)=> <div key={i} className="w-3 h-5 rounded" style={{ background: ok ? '#22c55e' : '#374151'}}/>)}
    </div>
  )
}
