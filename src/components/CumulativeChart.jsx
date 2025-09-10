import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, Legend } from 'recharts'
import { useStore } from '../store'
import dayjs from 'dayjs'

function fmtDate(d){ return dayjs(d).format('MMM D') }

export default function CumulativeChart(){
  const { data } = useStore(s=> s.cumulativeSeries())
  const exams = useStore(s=> s.exams)
  const hw = useStore(s=> s.homework)
  const keywords = useStore(s=> s.settings.homeworkKeywords.map(k=>k.toLowerCase()))
  const subjects = useStore(s=> s.subjects)

  // Homework due dates that look like revision
  const hwMarkers = hw.filter(h=>{
    const t = (h.title||'').toLowerCase(), d=(h.description||'').toLowerCase()
    return keywords.some(k=> t.includes(k) || d.includes(k))
  })

  return (
    <div className="bg-card rounded-xl2 p-4 shadow-soft border border-edge">
      <div className="mb-2 text-sub text-sm">Cumulative Hours</div>
      <div className="h-80">
        <ResponsiveContainer>
          <LineChart data={data} margin={{top:10,right:16,left:0,bottom:8}}>
            <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#9fb0c1"/>
            <YAxis stroke="#9fb0c1"/>
            <Tooltip labelFormatter={fmtDate}/>
            <Legend/>
            {/* Total */}
            <Line type="monotone" dataKey="total" stroke="#cbd5e1" strokeWidth={3} dot={false} name="Total (hrs)"/>
            {/* Subjects */}
            {subjects.map(s=> (
              <Line key={s.id} type="monotone" dataKey={s.id} stroke={s.color} strokeWidth={2} dot={false} name={s.name}/>
            ))}
            {/* Exam markers */}
            {exams.map((ex,i)=> (
              <ReferenceLine key={'ex'+i} x={ex.date} stroke="#f59e0b" strokeDasharray="4 4"/>
            ))}
            {/* Homework due markers */}
            {hwMarkers.map((h,i)=> h.due_date ? (
              <ReferenceLine key={'hw'+i} x={h.due_date} stroke="#a855f7" strokeDasharray="4 4"/>
            ): null)}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-sub">Orange = exams, Purple = homework due (looks like revision)</div>
    </div>
  )
}
