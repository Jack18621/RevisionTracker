import { useRef, useState } from 'react'
import { useStore } from '../store'
import dayjs from 'dayjs'

export default function Settings(){
  const settings = useStore(s=> s.settings)
  const update = useStore(s=> s.updateSettings)
  const exams = useStore(s=> s.exams)
  const addExam = useStore(s=> s.addExam)
  const removeExamAt = useStore(s=> s.removeExamAt)
  const importHomework = useStore(s=> s.importHomework)

  const fileRef = useRef()
  const [jsonText, setJsonText] = useState('')

  function onFile(e){
    const file = e.target.files?.[0]; if(!file) return
    const reader = new FileReader()
    reader.onload = ()=> {
      try{ importHomework(JSON.parse(reader.result)); alert('Homework imported!') }
      catch{ alert('Invalid JSON') }
    }
    reader.readAsText(file)
  }

  function importText(){
    try{ importHomework(JSON.parse(jsonText)); alert('Homework imported!') }
    catch{ alert('Invalid JSON') }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-card rounded-xl2 p-4 shadow-soft border border-edge space-y-3">
        <div className="font-medium">General</div>
        <label className="text-sm opacity-80">Daily target (minutes)
          <input type="number" className="mt-1 w-full bg-[#0f151d] border border-edge rounded-xl2 p-2"
            value={settings.dailyTargetMin} onChange={e=> update({dailyTargetMin: parseInt(e.target.value||'0')})}/>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={settings.includeWeekends} onChange={e=> update({includeWeekends: e.target.checked})}/>
          Include weekends in streak
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm opacity-80">Range start
            <input type="date" className="mt-1 w-full bg-[#0f151d] border border-edge rounded-xl2 p-2"
              value={settings.rangeStart} onChange={e=> update({rangeStart: e.target.value})}/>
          </label>
          <label className="text-sm opacity-80">Range end
            <input type="date" className="mt-1 w-full bg-[#0f151d] border border-edge rounded-xl2 p-2"
              value={settings.rangeEnd} onChange={e=> update({rangeEnd: e.target.value})}/>
          </label>
        </div>
        <label className="text-sm opacity-80">Homework keywords (comma separated)
          <input type="text" className="mt-1 w-full bg-[#0f151d] border border-edge rounded-xl2 p-2"
            value={settings.homeworkKeywords.join(', ')} onChange={e=> update({homeworkKeywords: e.target.value.split(',').map(s=> s.trim()).filter(Boolean)})}/>
        </label>
      </div>

      <div className="bg-card rounded-xl2 p-4 shadow-soft border border-edge space-y-3">
        <div className="font-medium">Homework import (JSON)</div>
        <div className="text-sub text-sm">Either drop a JSON file or paste JSON below. Shape: <code>[{"{"}title, description, due_date{"}"}]</code></div>
        <input ref={fileRef} onChange={onFile} type="file" accept="application/json" className="block w-full"/>
        <textarea className="mt-2 w-full h-32 bg-[#0f151d] border border-edge rounded-xl2 p-2"
          value={jsonText} onChange={e=> setJsonText(e.target.value)} placeholder='[{"title":"Revise Maths","due_date":"2026-05-10"}]'/>
        <div className="flex gap-2">
          <button onClick={importText} className="px-4 py-2 rounded-xl2 bg-brand">Import</button>
          <button onClick={()=> { setJsonText(''); if(fileRef.current) fileRef.current.value=null }} className="px-4 py-2 rounded-xl2 bg-[#121a23] border border-edge">Clear</button>
        </div>
      </div>

      <div className="bg-card rounded-xl2 p-4 shadow-soft border border-edge space-y-3 md:col-span-2">
        <div className="font-medium">Exam dates</div>
        <div className="grid md:grid-cols-3 gap-3">
          <AddExamForm onAdd={addExam}/>
        </div>
        <div className="mt-2 divide-y divide-edge">
          {exams.map((ex,i)=>(
            <div key={i} className="py-2 flex items-center justify-between">
              <div className="text-sm">{ex.date}</div>
              <div className="opacity-80">{ex.subject_id}</div>
              <div className="text-sub text-sm">{ex.label}</div>
              <button onClick={()=> removeExamAt(i)} className="px-3 py-1 rounded-xl2 bg-[#121a23] border border-edge">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AddExamForm({onAdd}){
  const [subject_id, setSub] = useState('maths')
  const [date, setDate] = useState('2026-05-01')
  const [label, setLabel] = useState('Exam')
  return (
    <div className="col-span-3 grid md:grid-cols-3 gap-3">
      <label className="text-sm opacity-80">Subject
        <select className="mt-1 w-full bg-[#0f151d] border border-edge rounded-xl2 p-2" value={subject_id} onChange={e=> setSub(e.target.value)}>
          <option value="maths">Maths</option><option value="science">Science</option><option value="english">English</option>
          <option value="geog">Geog</option><option value="compsci">Comp Sci</option><option value="business">Business</option>
        </select>
      </label>
      <label className="text-sm opacity-80">Date
        <input type="date" className="mt-1 w-full bg-[#0f151d] border border-edge rounded-xl2 p-2" value={date} onChange={e=> setDate(e.target.value)}/>
      </label>
      <label className="text-sm opacity-80">Label
        <input type="text" className="mt-1 w-full bg-[#0f151d] border border-edge rounded-xl2 p-2" value={label} onChange={e=> setLabel(e.target.value)}/>
      </label>
      <div className="md:col-span-3">
        <button onClick={()=> onAdd({subject_id, date, label})} className="px-4 py-2 rounded-xl2 bg-brand">Add exam</button>
      </div>
    </div>
  )
}
