import { useStore } from '../store'
import CumulativeChart from '../components/CumulativeChart.jsx'
import StreakHeatstrip from '../components/StreakHeatstrip.jsx'

export default function Dashboard(){
  const addSessionStart = useStore(s=> s.addSessionStart)
  const endRunningSession = useStore(s=> s.endRunningSession)
  const subjects = useStore(s=> s.subjects)
  const daily = useStore(s=> s.settings.dailyTargetMin)
  const includeWeekends = useStore(s=> s.settings.includeWeekends)
  const streakVal = useStore(s=> s.streak)(includeWeekends, daily)

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl2 p-4 shadow-soft border border-edge">
          <div className="flex items-center gap-2">
            <div className="text-sub text-sm">Quick start</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {subjects.map(s=> (
              <button key={s.id} onClick={()=> addSessionStart(s.id)}
                className="px-3 py-2 rounded-xl2 border border-edge bg-[#121a23] hover:bg-[#17212c]">{s.name} • Start</button>
            ))}
            <button onClick={endRunningSession} className="px-3 py-2 rounded-xl2 bg-brand text-white">Stop current</button>
          </div>
        </div>
        <div className="bg-card rounded-xl2 p-4 shadow-soft border border-edge">
          <div className="flex items-center justify-between">
            <div className="font-medium">Streak <span className="opacity-70">({includeWeekends? 'incl. weekends':'weekdays only'})</span></div>
            <div className="text-xl">🔥 {streakVal}</div>
          </div>
          <div className="mt-3"><StreakHeatstrip/></div>
        </div>
      </div>
      <CumulativeChart/>
    </div>
  )
}
