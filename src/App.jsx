import { useState, useEffect, useRef } from 'react'
import { db } from './firebase'
import { ref, get, set, update, onValue, off } from 'firebase/database'

/* ── helpers ── */
const KD = ['일','월','화','수','목','금','토']
const KM = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
function dk(y,m,d){ return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` }
function pk(k){ const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d) }
function today(){ const t=new Date(); return new Date(t.getFullYear(),t.getMonth(),t.getDate()) }
function makeCode(){ return Math.random().toString(36).slice(2,6).toUpperCase() }
const COLORS=['#e85d3a','#2d6a4f','#264653','#7209b7','#f4a261','#2b6cb0','#805ad5','#c9184a']
function ac(n){ let h=0; for(const c of n) h=(h*31+c.charCodeAt(0))%COLORS.length; return COLORS[h] }

function useToast(){
  const [msg,setMsg]=useState(null); const t=useRef()
  const show=(m)=>{ setMsg(m); clearTimeout(t.current); t.current=setTimeout(()=>setMsg(null),2600) }
  return {msg,show}
}

/* ── Calendar ── */
function Calendar({ selected, onChange }){
  const now=today()
  const [year,setYear]=useState(now.getFullYear())
  const [month,setMonth]=useState(now.getMonth())
  const dim=new Date(year,month+1,0).getDate()
  const fd=new Date(year,month,1).getDay()
  const cells=[...Array(fd).fill(null),...Array.from({length:dim},(_,i)=>i+1)]
  while(cells.length%7) cells.push(null)
  const prev=()=>month===0?(setYear(y=>y-1),setMonth(11)):setMonth(m=>m-1)
  const next=()=>month===11?(setYear(y=>y+1),setMonth(0)):setMonth(m=>m+1)
  const toggle=(d)=>{ const k=dk(year,month,d),s=new Set(selected); s.has(k)?s.delete(k):s.add(k); onChange([...s]) }
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <button onClick={prev} className="nav-btn">‹</button>
        <b style={{fontSize:18}}>{year}년 {KM[month]}</b>
        <button onClick={next} className="nav-btn">›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
        {['일','월','화','수','목','금','토'].map((d,i)=>(
          <div key={d} style={{textAlign:'center',fontSize:11,fontWeight:700,padding:'4px 0',
            color:i===0?'var(--red)':i===6?'#2b6cb0':'var(--muted)'}}>{d}</div>
        ))}
        {cells.map((d,i)=>{
          if(!d) return <div key={i} style={{aspectRatio:1}}/>
          const k=dk(year,month,d),dt=new Date(year,month,d)
          const past=dt<now,dow=dt.getDay(),sel=selected.includes(k),isToday=dt.getTime()===now.getTime()
          return (
            <div key={i} onClick={()=>!past&&toggle(d)}
              className={`cal-day${sel?' sel':''}${past?' past':''}`}
              style={{color:past?'var(--warm2)':sel?'#fff':dow===0?'var(--red)':dow===6?'#2b6cb0':'var(--ink)'}}>
              {d}
              {isToday&&!sel&&<span className="today-dot"/>}
            </div>
          )
        })}
      </div>
      <div style={{marginTop:10,fontSize:11,color:'var(--muted)'}}>🟥 선택한 날 &nbsp;·&nbsp; 🟠 오늘</div>
    </div>
  )
}

/* ── ResultView ── */
function ResultView({ room, myName, onConfirm }){
  const entries=Object.entries(room.availability||{})
  const total=entries.length
  if(!total) return <div className="empty">아직 아무도 입력하지 않았어요.</div>
  const counts={}
  for(const[,days]of entries) for(const d of days) counts[d]=(counts[d]||0)+1
  const half=Math.ceil(total/2)
  const qualifying=Object.entries(counts).filter(([,c])=>c>=half).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
  if(!qualifying.length) return <div className="empty">과반수({half}명 이상) 가능한 날이 없어요.<br/>친구들이 더 입력하면 나타나요!</div>
  const maxCnt=qualifying[0][1]
  return (
    <div>
      <p style={{fontSize:13,color:'var(--muted)',marginBottom:16}}>
        총 <b style={{color:'var(--ink)'}}>{total}명</b> 중 <b style={{color:'var(--ink)'}}>{half}명</b> 이상 가능한 날짜
      </p>
      {qualifying.map(([k,cnt],idx)=>{
        const dt=pk(k),pct=(cnt/total)*100,isTop=cnt===maxCnt,isConf=room.confirmedDate===k
        const who=entries.filter(([,d])=>d.includes(k)).map(([n])=>n)
        return (
          <div key={k} className={`result-item${isConf?' confirmed':isTop?' top':''}`}>
            <div className="result-date">
              {isConf?<span>✅</span>:(isTop&&idx===0?<span>🏆</span>:null)}
              <div className="result-dd">{String(dt.getDate()).padStart(2,'0')}</div>
              <div className="result-meta">{KM[dt.getMonth()]}<br/>{KD[dt.getDay()]}요일</div>
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:8}}>
                {who.map(n=>(
                  <span key={n} className="name-tag" style={{
                    borderColor:isConf?'rgba(255,255,255,.3)':ac(n),
                    background:isConf?'rgba(255,255,255,.1)':ac(n)+'22',
                    color:isConf?'#fff':'var(--ink)'}}>
                    {n}{n===myName?' (나)':''}
                  </span>
                ))}
              </div>
              <div className="bar-bg">
                <div className="bar-fill" style={{width:`${pct}%`,background:isConf?'rgba(255,255,255,.6)':isTop?'var(--green)':'var(--org)'}}/>
              </div>
              <div className="bar-label">{cnt}/{total}명 가능</div>
            </div>
            {!room.confirmedDate&&(
              <button onClick={()=>onConfirm(k)} className="btn btn-green btn-sm">확정</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════ APP ══════════════════ */
export default function App(){
  const [screen,setScreen]=useState('home')
  const [tab,setTab]=useState('cal')
  const [roomCode,setRoomCode]=useState('')
  const [room,setRoom]=useState(null)
  const [myName,setMyName]=useState(()=>localStorage.getItem('moayo_name')||'')
  const [nameInput,setNameInput]=useState('')
  const [codeInput,setCodeInput]=useState('')
  const [myDays,setMyDays]=useState([])
  const [newPlace,setNewPlace]=useState('')
  const [saved,setSaved]=useState(false)
  const [loading,setLoading]=useState(false)
  const {msg:toast,show:showToast}=useToast()
  const listenerRef=useRef(null)

  /* realtime listener */
  useEffect(()=>{
    if(!roomCode) return
    const roomRef=ref(db,`rooms/${roomCode}`)
    const unsub=onValue(roomRef,(snap)=>{
      if(snap.exists()) setRoom(snap.val())
    })
    listenerRef.current=()=>off(roomRef,'value',unsub)
    return ()=>{ if(listenerRef.current) listenerRef.current() }
  },[roomCode])

  const getName=()=>(nameInput.trim()||myName).trim()

  const enterRoom=(code,name,roomData)=>{
    localStorage.setItem('moayo_name',name)
    setMyName(name)
    setRoomCode(code)
    setRoom(roomData)
    setMyDays(roomData.availability?.[name]||[])
    setSaved(false)
    setTab('cal')
    setScreen('room')
    setLoading(false)
  }

  /* 방 만들기 */
  const createRoom=async()=>{
    const name=getName()
    if(!name){ showToast('이름을 입력해주세요!'); return }
    setLoading(true)
    const code=makeCode()
    const data={ availability:{ [name]:[] }, confirmedDate:null, places:[], createdAt:Date.now() }
    try{
      await set(ref(db,`rooms/${code}`),data)
      enterRoom(code,name,data)
    } catch(e){
      showToast('저장 실패. Firebase 설정을 확인해주세요.')
      console.error(e)
      setLoading(false)
    }
  }

  /* 방 참여 */
  const joinRoom=async()=>{
    const name=getName(), code=codeInput.trim().toUpperCase()
    if(!name){ showToast('이름을 입력해주세요!'); return }
    if(!code){ showToast('방 코드를 입력해주세요!'); return }
    setLoading(true)
    try{
      const snap=await get(ref(db,`rooms/${code}`))
      if(!snap.exists()){ showToast('방을 찾을 수 없어요. 코드를 확인해주세요.'); setLoading(false); return }
      const r=snap.val()
      if(!r.availability[name]){
        await update(ref(db,`rooms/${code}/availability`),{ [name]:[] })
        r.availability[name]=[]
      }
      enterRoom(code,name,r)
    } catch(e){
      showToast('오류가 발생했어요.')
      console.error(e)
      setLoading(false)
    }
  }

  /* 가용일 저장 */
  const saveDays=async()=>{
    try{
      await set(ref(db,`rooms/${roomCode}/availability/${myName}`),myDays)
      setSaved(true); showToast('✓ 저장됐어요!')
    } catch(e){ showToast('저장 실패.') }
  }

  /* 날짜 확정 */
  const confirmDate=async(k)=>{
    try{
      await set(ref(db,`rooms/${roomCode}/confirmedDate`),k)
      showToast('🎉 날짜 확정!')
    } catch(e){ showToast('오류가 발생했어요.') }
  }

  /* 장소 */
  const addPlace=async()=>{
    if(!newPlace.trim()) return
    const places=[...(room.places||[])].filter(p=>p!==newPlace.trim())
    places.push(newPlace.trim())
    await set(ref(db,`rooms/${roomCode}/places`),places)
    setNewPlace(''); showToast('장소 추가됨!')
  }
  const removePlace=async(p)=>{
    const places=(room.places||[]).filter(x=>x!==p)
    await set(ref(db,`rooms/${roomCode}/places`),places)
  }

  const members=Object.keys(room?.availability||{})
  const confDate=room?.confirmedDate?pk(room.confirmedDate):null

  /* ══ HOME ══ */
  if(screen==='home') return (
    <div className="page">
      <header className="header">
        <div className="logo">🐾 노올<em>자!!!</em></div>
      </header>
      <div className="container" style={{maxWidth:440}}>
        <div className="hero">
          <div className="hero-icon">🐱</div>
          <h1>냥이들 언제 모일 수 있냥? 🐱</h1>
          <p>방 코드 하나로 친구들과<br/>가용일을 실시간으로 취합해요 🐾</p>
        </div>

        <div className="card">
          <div className="card-label">내 이름</div>
          <input className="inp" placeholder="이름 입력..." value={nameInput||myName}
            onChange={e=>setNameInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&createRoom()}/>
        </div>

        <button onClick={createRoom} disabled={loading} className="btn btn-red btn-full">
          {loading?'처리 중...':'+ 새 방 만들기'}
        </button>

        <div className="divider"><span>또는</span></div>

        <div className="card">
          <div className="card-label">친구 방에 참여하기</div>
          <input className="inp code-inp" placeholder="방 코드" value={codeInput}
            onChange={e=>setCodeInput(e.target.value.toUpperCase())} maxLength={6}
            onKeyDown={e=>e.key==='Enter'&&joinRoom()}/>
          <button onClick={joinRoom} disabled={loading||!codeInput.trim()} className="btn btn-outline btn-full" style={{marginTop:10}}>
            참여하기 →
          </button>
        </div>
      </div>
      {toast&&<div className="toast">{toast}</div>}
    </div>
  )

  /* ══ ROOM ══ */
  return (
    <div className="page">
      <header className="header room-header">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={()=>{ if(listenerRef.current) listenerRef.current(); setScreen('home') }} className="back-btn">←</button>
          <div className="logo">🐾 노올<em>자!!!</em></div>
        </div>
        <div className="code-badge-wrap">
          <span className="code-badge-label">방 코드</span>
          <div className="code-badge" onClick={()=>{ navigator.clipboard.writeText(roomCode).then(()=>showToast(`"${roomCode}" 복사됨! 친구에게 공유하세요 📋`)) }}>
            {roomCode}
          </div>
        </div>
      </header>

      <div className="tab-bar">
        {[['cal','📅 가용일'],['result','📊 결과']].map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)} className={`tab-btn${tab===t?' active':''}`}>{label}</button>
        ))}
      </div>

      <div className="container">
        {/* 참여자 */}
        <div className="members-row">
          {members.map(m=>(
            <div key={m} className="member-chip">
              <div className="member-av" style={{background:ac(m)}}>{m[0]}</div>
              {m}
              {m===myName&&<span className="you-badge">나</span>}
              <span className="member-days">{(room.availability[m]||[]).length}일</span>
            </div>
          ))}
          <span className="share-hint">코드 <b style={{color:'var(--red)',fontFamily:'monospace',letterSpacing:2}}>{roomCode}</b> 공유하세요</span>
        </div>

        {/* 확정 배너 */}
        {room.confirmedDate&&confDate&&(
          <div className="confirmed-banner">
            <div className="confirmed-label">🎉 약속 확정!</div>
            <div className="confirmed-date">{confDate.getFullYear()}.{String(confDate.getMonth()+1).padStart(2,'0')}.{String(confDate.getDate()).padStart(2,'0')}</div>
            <div className="confirmed-sub">{KM[confDate.getMonth()]} {confDate.getDate()}일 ({KD[confDate.getDay()]}요일)</div>
          </div>
        )}

        {/* CAL */}
        {tab==='cal'&&(
          <>
            <div className="card">
              <div className="card-label">📅 {myName}님의 가용일 선택</div>
              <Calendar selected={myDays} onChange={d=>{ setMyDays(d); setSaved(false) }}/>
              <button onClick={saveDays} className={`btn btn-full${saved?' btn-green':' btn-red'}`} style={{marginTop:16}}>
                {saved?`✓ 저장됨 (${myDays.length}일)`:`저장하기 (${myDays.length}일 선택됨)`}
              </button>
            </div>
            <div className="card">
              <div className="card-label">📍 장소 후보</div>
              {!(room.places||[]).length
                ?<div className="empty">아직 없어요</div>
                :<div className="places">{room.places.map(p=>(
                    <span key={p} className="place-chip">
                      {p}<button onClick={()=>removePlace(p)} className="remove-btn">×</button>
                    </span>
                  ))}</div>
              }
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <input className="inp" placeholder="장소 추가..." value={newPlace}
                  onChange={e=>setNewPlace(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addPlace()}/>
                <button onClick={addPlace} className="btn btn-outline">추가</button>
              </div>
            </div>
          </>
        )}

        {/* RESULT */}
        {tab==='result'&&(
          <div className="card">
            <div className="card-label">📊 과반수 가능한 날짜</div>
            <ResultView room={room} myName={myName} onConfirm={confirmDate}/>
          </div>
        )}
      </div>
      {toast&&<div className="toast">{toast}</div>}
    </div>
  )
}
