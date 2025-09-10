import create from 'zustand'
import dayjs from 'dayjs'

const DEFAULT_SUBJECTS = [
  { id:'maths', name:'Maths', color:'#22d3ee' },
  { id:'science', name:'Science', color:'#22c55e' },
  { id:'english', name:'English', color:'#f97316' },
  { id:'geog', name:'Geog', color:'#a855f7' },
  { id:'compsci', name:'Comp Sci', color:'#60a5fa' },
  { id:'business', name:'Business', color:'#e11d48' },
]

// GCSE 2026 dates baked in (verify with official timetables)
const BAKED_EXAMS_2026 = [
  { subject_id:'maths', date:'2026-05-19', label:'Maths Paper 1 — JCQ' },
  { subject_id:'maths', date:'2026-06-03', label:'Maths Paper 2 — JCQ' },
  { subject_id:'maths', date:'2026-06-12', label:'Maths Paper 3 — JCQ' },
  { subject_id:'english', date:'2026-05-12', label:'Eng Lang P1 — JCQ' },
  { subject_id:'english', date:'2026-05-22', label:'Eng Lang P2 — JCQ' },
  { subject_id:'english', date:'2026-06-05', label:'Eng Lit P1 — JCQ' },
  { subject_id:'english', date:'2026-06-15', label:'Eng Lit P2 — JCQ' },
  { subject_id:'science', date:'2026-05-14', label:'Science P1 — JCQ' },
  { subject_id:'science', date:'2026-05-22', label:'Science P2 — JCQ' },
  { subject_id:'science', date:'2026-06-10', label:'Science P3 — JCQ' },
  { subject_id:'compsci', date:'2026-05-13', label:'OCR Comp Sci P1' },
  { subject_id:'compsci', date:'2026-05-19', label:'OCR Comp Sci P2' },
  { subject_id:'geog', date:'2026-05-13', label:'AQA Geog P1' },
  { subject_id:'geog', date:'2026-06-03', label:'AQA Geog P2' },
  { subject_id:'geog', date:'2026-06-11', label:'AQA Geog P3' },
]

const persistKey = 'rt_ultra_v1'

const initial = (()=>{
  const saved = localStorage.getItem(persistKey)
  if(saved) return JSON.parse(saved)
  return {
    settings: {
      dailyTargetMin: 45,
      includeWeekends: false,
      rangeStart: '2025-09-01',
      rangeEnd: '2026-07-31',
      homeworkKeywords: ['revise','revision','study','prepare','practice']
    },
    subjects: DEFAULT_SUBJECTS,
    sessions: [], // {startISO,endISO,subject_id}
    exams: BAKED_EXAMS_2026,
    homework: [] // {title, description, due_date}
  }
})()

export const useStore = create((set, get)=> ({
  ...initial,
  _persist(){ localStorage.setItem(persistKey, JSON.stringify(get())) },
  addSessionStart(subject_id){
    const s = { startISO: dayjs().toISOString(), endISO: null, subject_id }
    set({ sessions: [...get().sessions, s] })
    get()._persist()
  },
  endRunningSession(){
    const list = [...get().sessions]
    for(let i=list.length-1;i>=0;i--){
      if(!list[i].endISO){ list[i].endISO = dayjs().toISOString(); break; }
    }
    set({ sessions: list }); get()._persist()
  },
  minutesPerDay(){
    const {rangeStart, rangeEnd} = get().settings
    const start = dayjs(rangeStart)
    const end = dayjs(rangeEnd)
    const days = {}
    let d = start
    while(d.isBefore(end) || d.isSame(end,'day')){
      days[d.format('YYYY-MM-DD')] = {}
      d = d.add(1,'day')
    }
    for(const s of get().sessions){
      const s1 = dayjs(s.startISO)
      const s2 = dayjs(s.endISO || dayjs())
      if(s2.isBefore(s1)) continue
      let cur = s1.startOf('day')
      while(cur.isBefore(s2) || cur.isSame(s2,'day')){
        const segStart = dayjs.max(s1, cur.startOf('day'))
        const segEnd = dayjs.min(s2, cur.endOf('day'))
        const mins = Math.max(0, segEnd.diff(segStart,'minute'))
        if(mins>0){
          const key = cur.format('YYYY-MM-DD')
          days[key] ||= {}
          days[key][s.subject_id] = (days[key][s.subject_id]||0)+mins
        }
        cur = cur.add(1,'day')
      }
    }
    return days
  },
  cumulativeSeries(){
    const days = get().minutesPerDay()
    const subjects = get().subjects
    const keys = Object.keys(days).sort()
    const totals = Array(keys.length).fill(0)
    const perSub = {}
    subjects.forEach(s=> perSub[s.id] = Array(keys.length).fill(0))
    keys.forEach((k, i)=>{
      const m = days[k]
      let t=0
      for(const sid in m){ perSub[sid][i] += m[sid]; t += m[sid] }
      totals[i] = (i>0?totals[i-1]:0) + t
      for(const sid in perSub){
        perSub[sid][i] = (i>0?perSub[sid][i-1]:0) + (m[sid]||0)
      }
    })
    // convert to hours
    const toHours = arr => arr.map(v=> v/60)
    const data = keys.map((k,i)=>{
      const row = { date: k, total: totals[i]/60 }
      for(const s of subjects){ row[s.id] = perSub[s.id][i]/60 }
      return row
    })
    return { keys, data }
  },
  streak(includeWeekends, target){
    const {rangeStart, rangeEnd} = get().settings
    const days = get().minutesPerDay()
    let day = dayjs(rangeEnd)
    let start = dayjs(rangeStart)
    let streak=0
    while(day.isAfter(start) || day.isSame(start,'day')){
      if(!includeWeekends && (day.day()===0 || day.day()===6)){
        day = day.subtract(1,'day'); continue
      }
      const k = day.format('YYYY-MM-DD')
      const total = Object.values(days[k]||{}).reduce((a,b)=>a+b,0)
      if(total >= target) streak++
      else break
      day = day.subtract(1,'day')
    }
    return streak
  },
  importHomework(items){
    set({ homework: items }); get()._persist()
  },
  addExam(ex){ set({ exams: [...get().exams, ex] }); get()._persist() },
  removeExamAt(i){ const arr=[...get().exams]; arr.splice(i,1); set({exams:arr}); get()._persist() },
  updateSettings(p){ set({ settings: {...get().settings, ...p}}); get()._persist() }
}))
