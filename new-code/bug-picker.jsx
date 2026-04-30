/* global React, ReactDOM */
const { useState, useEffect } = React;

// Code rendering
function CodeBlock({ file, tokens }) {
  const lines = []; let cur = [];
  for (const t of tokens) {
    if (t.length === 0 || t[0] === 'br') { lines.push(cur); cur = []; continue; }
    let arr = t.slice();
    while (arr.length) {
      const a = arr.shift();
      if (typeof a === 'string' && (a.match(/^\s+$/) || a === '...')) {
        cur.push({ cls: 'plain', txt: a }); continue;
      }
      const cls = a; const txt = arr.shift();
      cur.push({ cls, txt: txt ?? '' });
    }
  }
  if (cur.length) lines.push(cur);
  return (
    <div className="code">
      <div className="titlebar">{file}</div>
      <pre>
        {lines.map((line, i) => (
          <div key={i}>
            {line.length === 0 ? '\u00A0' : line.map((s, j) => (
              <span key={j} className={'tok-' + s.cls}>{s.txt}</span>
            ))}
          </div>
        ))}
      </pre>
    </div>
  );
}

// Stepper: t = 0..4
function Stepper({ step, setStep, captions }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (step >= 4) { setPlaying(false); return; }
    const id = setTimeout(() => setStep(step + 1), 1700);
    return () => clearTimeout(id);
  }, [playing, step]);
  const togglePlay = () => {
    if (step >= 4) { setStep(0); setPlaying(true); }
    else setPlaying(!playing);
  };
  const pct = (step / 4) * 100;
  return (
    <div className="stepper-wrap">
      <div className="step-caption">
        <span className="step-tag">step {step}</span>
        <span className="step-text">{captions[step]}</span>
      </div>
      <div className="stepper">
        <button className="play-btn" onClick={togglePlay} aria-label={playing ? 'pause' : 'play'}>
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14"><rect x="3" y="2" width="3" height="10" fill="currentColor"/><rect x="8" y="2" width="3" height="10" fill="currentColor"/></svg>
          ) : step >= 4 ? (
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M11.5 7 a4.5 4.5 0 1 1 -1.32 -3.18" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/><path d="M12 2 L12 5 L9 5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 2 L11 7 L3 12 Z" fill="currentColor"/></svg>
          )}
        </button>
        <button className="step-btn" disabled={step === 0} onClick={() => { setPlaying(false); setStep(Math.max(0, step - 1)); }}>← back</button>
        <div className="step-track" onClick={(e) => {
          setPlaying(false);
          const r = e.currentTarget.getBoundingClientRect();
          const p = (e.clientX - r.left) / r.width;
          setStep(Math.max(0, Math.min(4, Math.round(p * 4))));
        }}>
          <div className="step-fill" style={{ width: pct + '%' }}/>
          <div className="step-head" style={{ left: pct + '%' }}/>
        </div>
        <button className="step-btn" disabled={step === 4} onClick={() => { setPlaying(false); setStep(Math.min(4, step + 1)); }}>next →</button>
      </div>
    </div>
  );
}

const C = {
  primary: '#c9bfff', primaryStrong: '#917eff', primaryDeep: '#5d40dd',
  secondary: '#f3affa', good: '#5be38a', err: '#ff8a82',
  ink: '#f2dbfb', inkDim: '#c9c4d7', line: '#484555', surface: '#16081f',
};

// ── 1. Race
//   0 idle   1 read OK   2 refresh tick   3 cache=null + read breaks   4 cache fresh
function RaceViz() {
  const [step, setStep] = useState(0);
  const captions = [
    'Idle. Cache holds yesterday\'s revenue total.',
    'A reader fires and gets a valid number — everything looks fine.',
    'The refresh job ticks. It\'s about to clear the cache to recalculate.',
    'Cache is now null for ~10ms. A second reader fires inside that window and gets null — alert is silently skipped.',
    'Refresh finishes. Cache is fresh again. The bug already happened — and left no trace.',
  ];
  const W = 560;
  // Reader timeline (top), Refresh timeline (bottom)
  const reads = [{at:.20,l:'read OK'},{at:.55,l:'read → null 💥'}];
  const refresh = [{at:.40,l:'tick'},{at:.50,l:'cache=null'},{at:.78,l:'cache=fresh'}];
  const x = (a) => 60 + a * (W - 90);
  const readReached = (i) => (i === 0 && step >= 1) || (i === 1 && step >= 3);
  const refReached = (a) => (step >= 2 && a <= .50) || (step >= 4 && a <= .78);
  const playhead = step === 0 ? 0 : step === 1 ? .20 : step === 2 ? .42 : step === 3 ? .55 : .80;
  return (
    <div className="viz-panel">
      <div className="viz-head"><span>two timelines · same 10ms window</span><span className="pill"><span className="dot"></span>STEP {step}</span></div>
      <div className="viz-stage">
        <svg viewBox={`0 0 ${W} 220`} width="100%" height="240">
          {/* Reader (top) */}
          <line x1="60" y1="60" x2={W-30} y2="60" stroke={C.line} strokeWidth="2"/>
          <text x="60" y="42" fill={C.secondary}>sendRevenueAlert() 📟  (reader)</text>
          {reads.map((n,i) => {
            const isNull = i === 1;
            const got = readReached(i);
            return (<g key={i}>
              <circle cx={x(n.at)} cy="60" r="7" fill={got?(isNull?C.err:C.good):C.surface} stroke={isNull?C.err:C.good} strokeWidth="1.8" className={got&&isNull?'race-flash':''}/>
              <text x={x(n.at)} y="84" textAnchor="middle" fill={isNull?C.err:C.inkDim}>{n.l}</text>
            </g>);
          })}

          {/* Null window highlight */}
          {step >= 3 && (<>
            <rect x={x(.50)} y="100" width={x(.78)-x(.50)} height="60" fill="rgba(255,138,130,0.14)" stroke="rgba(255,138,130,0.5)" strokeDasharray="4 4" rx="6"/>
            <text x={(x(.50)+x(.78))/2} y="120" textAnchor="middle" fill={C.err}>null window · 10ms 😱</text>
            <text x={(x(.50)+x(.78))/2} y="138" textAnchor="middle" fill={C.err} fontSize="10">reader sees null here</text>
          </>)}

          {/* Refresh job (bottom) */}
          <line x1="60" y1="180" x2={W-30} y2="180" stroke={C.line} strokeWidth="2"/>
          <text x="60" y="204" fill={C.primary}>refreshRevenueCache() 🔄</text>
          {refresh.map((n,i) => (<g key={i}>
            <circle cx={x(n.at)} cy="180" r="7" fill={refReached(n.at)?C.primaryStrong:C.surface} stroke={C.primaryStrong} strokeWidth="1.8"/>
            <text x={x(n.at)} y="166" textAnchor="middle" fill={C.inkDim}>{n.l}</text>
          </g>))}

          {step > 0 && (<>
            <line x1={x(playhead)} y1="20" x2={x(playhead)} y2="200" stroke={C.ink} strokeDasharray="2 5" opacity=".55"/>
            <circle cx={x(playhead)} cy="20" r="5" fill={C.ink}/>
          </>)}
        </svg>
      </div>
      <Stepper step={step} setStep={setStep} captions={captions}/>
    </div>
  );
}

// ── 2. Deadlock
//   0 idle   1 cleanup starts   2 lock acquired   3 createOrder waits   4 timeout
function DeadlockViz() {
  const [step, setStep] = useState(0);
  const captions = [
    'Idle. The orders table is free.',
    'Nightly cleanup job starts. There\'s no index, so it begins a full table scan.',
    'Cleanup now holds an exclusive lock on the entire table while it scans millions of rows.',
    'A user creates an order. The write queues up — waiting for the table lock to release.',
    'Lock never releases in time. createOrder hits its timeout and the user sees a 500.',
  ];
  const W = 560;
  const fills = [0, .15, .60, .80, .95];
  const lockFill = fills[step];
  const writerActive = step >= 3;
  const timedOut = step >= 4;
  return (
    <div className="viz-panel">
      <div className="viz-head"><span>cleanup holds the lock · writes pile up</span><span className="pill"><span className="dot"></span>STEP {step}</span></div>
      <div className="viz-stage">
        <svg viewBox={`0 0 ${W} 240`} width="100%" height="260">
          <text x="80" y="30" fill={C.primary}>🧹 purgeDeletedAccounts</text>
          <text x="80" y="48" fill={C.inkDim} fontSize="10">{step === 0 ? 'idle' : step >= 2 ? 'holds table lock' : 'starting…'}</text>
          <rect x="80" y="60" width="180" height="44" rx="8" fill={C.surface} stroke={C.line}/>
          <rect x="80" y="60" width={180*lockFill} height="44" rx="8" fill="url(#purpgrad)"/>
          <text x="170" y="88" textAnchor="middle" fill={C.ink}>{step === 0 ? '—' : `scanning ${(lockFill*4812309|0).toLocaleString()} rows`}</text>
          <text x="320" y="30" fill={timedOut?C.err:writerActive?C.good:C.inkDim}>📦 createOrder</text>
          <text x="320" y="48" fill={C.inkDim} fontSize="10">{!writerActive ? 'idle' : timedOut ? 'timed out' : 'waiting…'}</text>
          <rect x="320" y="60" width="180" height="44" rx="8" fill={C.surface} stroke={timedOut?C.err:C.line}/>
          {writerActive && !timedOut && (<g transform="translate(410, 82)"><circle r="13" fill="none" stroke={C.line} strokeWidth="2"/><circle r="13" fill="none" stroke={C.secondary} strokeWidth="2" strokeDasharray="22 60" strokeLinecap="round"/></g>)}
          {timedOut && (<g><text x="410" y="92" textAnchor="middle" fontSize="20">🚫</text><text x="410" y="120" textAnchor="middle" fill={C.err}>lock_timeout</text></g>)}
          {writerActive && !timedOut && <text x="410" y="120" textAnchor="middle" fill={C.inkDim}>queued behind cleanup</text>}
          <defs><linearGradient id="purpgrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={C.primaryDeep}/><stop offset="1" stopColor={C.primaryStrong}/></linearGradient></defs>
        </svg>
      </div>
      <Stepper step={step} setStep={setStep} captions={captions}/>
    </div>
  );
}

// ── 3. Out of Order
//   0 idle   1 submit sent   2 delete sent   3 delete arrives   4 submit lands on null user
function OrderingViz() {
  const [step, setStep] = useState(0);
  const captions = [
    'Idle. The user is logged in and active.',
    'User clicks "submit form". The submit_form event leaves the client.',
    'A second later, user clicks "delete account". delete_account leaves the client too.',
    'delete_account arrives at the server first and wipes the user.',
    'submit_form arrives next — but the user no longer exists. Orphan row written. 💥',
  ];
  const W = 560;
  const submitX = step === 0 ? 60 : step === 1 ? 60+0.20*(W-130) : step === 2 ? 60+0.45*(W-130) : step === 3 ? 60+0.75*(W-130) : 60+1*(W-130);
  const deleteX = step <= 1 ? 60 : step === 2 ? 60+0.30*(W-130) : 60+1*(W-130);
  const arrived = step >= 3;
  const orphan = step >= 4;
  return (
    <div className="viz-panel">
      <div className="viz-head"><span>two events · racing on the wire</span><span className="pill"><span className="dot"></span>STEP {step}</span></div>
      <div className="viz-stage">
        <svg viewBox={`0 0 ${W} 220`} width="100%" height="260">
          <line x1="60" y1="120" x2={W-60} y2="120" stroke={C.line} strokeWidth="2"/>
          <text x="60" y="60" fill={C.inkDim}>📱 client</text>
          <text x={W-60} y="60" textAnchor="end" fill={C.inkDim}>🗄️ server</text>
          <circle cx="60" cy="120" r="7" fill={C.surface} stroke={C.inkDim}/>
          <circle cx={W-60} cy="120" r="7" fill={arrived?C.err:C.surface} stroke={arrived?C.err:C.inkDim}/>
          {step >= 1 && (<g transform={`translate(${submitX}, 120)`}>
            <rect x="-44" y="-32" width="88" height="22" rx="11" fill={C.surface} stroke={C.good}/>
            <text x="0" y="-17" textAnchor="middle" fill={C.good} fontSize="10">📝 submit_form</text>
            <line x1="0" y1="-10" x2="0" y2="0" stroke={C.good}/>
            <circle cx="0" cy="0" r="6" fill={C.good}/>
          </g>)}
          {step >= 2 && (<g transform={`translate(${deleteX}, 120)`}>
            <rect x="-44" y="10" width="88" height="22" rx="11" fill={C.surface} stroke={C.err}/>
            <text x="0" y="25" textAnchor="middle" fill={C.err} fontSize="10">🗑️ delete_account</text>
            <line x1="0" y1="0" x2="0" y2="10" stroke={C.err}/>
            <circle cx="0" cy="0" r="6" fill={C.err}/>
          </g>)}
          {arrived && <text x={W-60} y="100" textAnchor="middle" fill={C.err}>user deleted</text>}
          {orphan && (<g><text x={W-60} y="160" textAnchor="middle" fontSize="20">❌</text><text x={W-60} y="190" textAnchor="middle" fill={C.err}>orphan row 👻</text></g>)}
        </svg>
      </div>
      <Stepper step={step} setStep={setStep} captions={captions}/>
    </div>
  );
}

// ── 4. Zombie
//   0 idle   1 worker A picks job   2 worker A crashes   3 worker B restarts   4 zombie state
function ZombieViz() {
  const [step, setStep] = useState(0);
  const captions = [
    'Idle. job_4821 is queued, status: pending.',
    'Worker A picks up the job, marks it processing, starts work.',
    'Pod crashes mid-job. Status is still processing — but nobody is actually working on it.',
    'Worker B comes online, scans the queue, sees the job already marked processing, and skips it.',
    'Job is now a zombie — pulses forever in processing, never completes, never retries.',
  ];
  const W = 560;
  const fill = step <= 0 ? 0 : step === 1 ? .60 : .60;
  const crashed = step >= 2;
  const restarted = step >= 3;
  const skipped = step >= 4;
  return (
    <div className="viz-panel">
      <div className="viz-head"><span>job stuck in 'processing' forever</span><span className="pill"><span className="dot"></span>STEP {step}</span></div>
      <div className="viz-stage">
        <svg viewBox={`0 0 ${W} 240`} width="100%" height="260">
          <text x="60" y="38" fill={C.primary}>📨 job_4821 · email digest</text>
          <text x={W-60} y="38" textAnchor="end" fill={skipped?'#ffd49e':C.inkDim} fontSize="10">status: {skipped?"'processing' (zombie 🦟)":step===0?"'pending'":"'processing'"}</text>
          <rect x="60" y="56" width={W-120} height="32" rx="10" fill={C.surface} stroke={skipped?'#ffd49e':C.line}/>
          <rect x="60" y="56" width={(W-120)*fill} height="32" rx="10" fill={crashed?C.line:'url(#g2)'}/>
          <text x={W/2} y="78" textAnchor="middle" fill={crashed?C.inkDim:C.ink}>{step===0?'—':crashed?'crashed @ 60% 💥':`${(fill*100|0)}%`}</text>
          <text x="60" y="130" fill={C.inkDim}>👷 worker A</text>
          <line x1="60" y1="140" x2={W-60} y2="140" stroke={C.line}/>
          {step >= 1 && <rect x="60" y="135" width={(W-120)*0.36} height="10" rx="5" fill={C.primaryStrong} opacity={crashed?.4:1}/>}
          {crashed && <text x={60+(W-120)*0.40} y="132" fill={C.err}>✕ crashed</text>}
          <text x="60" y="170" fill={C.inkDim}>👷 worker B  (restarts)</text>
          <line x1="60" y1="180" x2={W-60} y2="180" stroke={C.line}/>
          {restarted && <rect x={60+(W-120)*0.5} y="175" width={(W-120)*0.4} height="10" rx="5" fill={C.good} opacity=".7"/>}
          {restarted && <text x={60+(W-120)*0.5+4} y="172" fill={C.good}>scan → skip 'processing' → idle</text>}
          {skipped && (<g><text x={W/2} y="208" textAnchor="middle" fill="#ffd49e">no peer is actually working on it</text><text x={W/2} y="226" textAnchor="middle" fill={C.inkDim} fontSize="10">no heartbeat · no lease · pulses forever</text></g>)}
          <defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={C.primaryDeep}/><stop offset="1" stopColor={C.primaryStrong}/></linearGradient></defs>
        </svg>
      </div>
      <Stepper step={step} setStep={setStep} captions={captions}/>
    </div>
  );
}

// ── 5. Stale Data
//   0 idle   1 client writes   2 DB confirms   3 invalidate sent   4 invalidate dropped
function CacheViz() {
  const [step, setStep] = useState(0);
  const captions = [
    'Idle. DB and downstream view both show the old name.',
    'Client sends an UPDATE — saving the new profile data.',
    'DB persists the write. Source of truth is now correct.',
    'Service tries to fan out invalidateOldData() to downstream consumers.',
    'Network hiccup drops the invalidation. Downstream still serves the old name for hours. 🥲',
  ];
  const W = 560;
  const writeP = step >= 1 ? 1 : 0;
  const dbConfirmed = step >= 2;
  const invStarted = step >= 3;
  const dropped = step >= 4;
  const stale = step >= 4;
  return (
    <div className="viz-panel">
      <div className="viz-head"><span>DB updated · invalidation dropped</span><span className="pill"><span className="dot"></span>STEP {step}</span></div>
      <div className="viz-stage">
        <svg viewBox={`0 0 ${W} 240`} width="100%" height="260">
          <rect x="40" y="80" width="120" height="80" rx="12" fill={C.surface} stroke={C.primaryStrong}/>
          <text x="100" y="106" textAnchor="middle" fill={C.primary}>🗄️ DB</text>
          <text x="100" y="128" textAnchor="middle" fill={dbConfirmed?C.good:C.inkDim} fontSize="10">{dbConfirmed?'name: "Ada"':'name: "Aida"'}</text>
          <text x="100" y="144" textAnchor="middle" fill={C.inkDim} fontSize="9">{dbConfirmed?'updated ✓':'...'}</text>
          <rect x={W-160} y="80" width="120" height="80" rx="12" fill={C.surface} stroke={stale?C.err:C.line}/>
          <text x={W-100} y="106" textAnchor="middle" fill={stale?C.err:C.inkDim}>📦 DOWNSTREAM</text>
          <text x={W-100} y="128" textAnchor="middle" fill={stale?C.err:C.inkDim} fontSize="10" opacity={stale?.75:1}>name: "Aida"</text>
          <text x={W-100} y="144" textAnchor="middle" fill={C.inkDim} fontSize="9">{stale?'TTL: 5h 47m 😬':'fresh'}</text>
          <text x="40" y="44" fill={C.inkDim}>👤 client</text>
          <circle cx="40" cy="60" r="5" fill={C.line}/>
          <line x1="50" y1="60" x2={50+60*writeP} y2="60" stroke={C.good} strokeWidth="2.5" strokeLinecap="round"/>
          {writeP >= 1 && <text x="125" y="64" fill={C.good} fontSize="10">UPDATE ✓</text>}
          {invStarted && (<g>
            <line x1="160" y1="120" x2={dropped?W/2:160+(W-320)} y2="120" stroke={dropped?C.err:C.secondary} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={dropped?'5 5':'none'}/>
            {!dropped && <circle cx={160+(W-320)} cy="120" r="7" fill={C.secondary}/>}
            {dropped && (<g transform={`translate(${W/2}, 120)`}><text x="0" y="6" textAnchor="middle" fontSize="22">💨</text><text x="0" y="-22" textAnchor="middle" fill={C.err}>DROPPED</text></g>)}
            <text x={W/2} y="108" textAnchor="middle" fill={C.inkDim} fontSize="9">invalidateOldData()</text>
          </g>)}
          {stale && (<g><text x={W-100} y="184" textAnchor="middle" fill={C.err}>1,247 old reads served</text><text x={W-100} y="200" textAnchor="middle" fill={C.inkDim} fontSize="9">user sees old data 🥲</text></g>)}
        </svg>
      </div>
      <Stepper step={step} setStep={setStep} captions={captions}/>
    </div>
  );
}

const VIZ_MAP = { race: RaceViz, deadlock: DeadlockViz, ordering: OrderingViz, zombie: ZombieViz, cache: CacheViz };

function Picker({ onPick }) {
  const [industry, setIndustry] = useState('web');
  return (
    <div className="picker fade-in">
      <h1>Pick your <span className="accent">least favorite</span> bug.</h1>
      <p className="sub">See how Antithesis finds it — before your users do.</p>
      <div className="ind-switch">
        <span className="ind-lab">I work in</span>
        <div className="ind-pills">
          {window.INDUSTRIES.map((ind) => (
            <button
              key={ind.id}
              className={'ind-pill' + (industry === ind.id ? ' active' : '')}
              onClick={() => setIndustry(ind.id)}>
              <span className="ind-emoji">{ind.emoji}</span>{ind.label}
            </button>
          ))}
        </div>
      </div>
      <div className="cards">
        {window.BUGS.map((b, i) => (
          <div key={b.id} className="card" onClick={() => onPick(b.id)}>
            <div className="bug-row">
              <span className="bug-emoji">{b.emoji}</span>
              <h2>{b.name}</h2>
            </div>
            <p className="sub-line">{b.industries[industry]}</p>
            <div className="arrow"><span>open</span><span className="pulse">→</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderVerdict(text) {
  const stripped = text.replace(/^Antithesis/, '');
  const parts = stripped.split(/(`[^`]+`)/g);
  return parts.map((p, i) => p.startsWith('`') && p.endsWith('`')
    ? <code key={i} className="inline-code">{p.slice(1, -1)}</code>
    : <React.Fragment key={i}>{p}</React.Fragment>);
}

function DeepDive({ id, onBack }) {
  const bug = window.BUGS.find((b) => b.id === id);
  const Viz = VIZ_MAP[id];
  const sec1Ref = React.useRef(null);
  const sec2Ref = React.useRef(null);
  const sec3Ref = React.useRef(null);
  const refs = [sec1Ref, sec2Ref, sec3Ref];
  const [activeIdx, setActiveIdx] = useState(0);

  // Smooth-scroll to a section. (Avoids scrollIntoView per house rules.)
  function scrollToSection(i) {
    const el = refs[i].current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // Track which section is in view
  useEffect(() => {
    function onScroll() {
      const probe = window.scrollY + window.innerHeight * 0.35;
      let i = 0;
      for (let k = 0; k < refs.length; k++) {
        const el = refs[k].current;
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (probe >= top) i = k;
      }
      setActiveIdx(i);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [id]);

  // Reset scroll when bug changes
  useEffect(() => { window.scrollTo({ top: 0 }); }, [id]);

  return (
    <div className="deep-scroll fade-in">
      <button className="back" onClick={onBack}>← pick a different bug</button>

      {/* SECTION 1 — bug + code */}
      <section ref={sec1Ref} className="vsec vsec-code" id="sec-code">
        <div className="vsec-inner">
          <div className="bug-headline">
            <span className="em">{bug.emoji}</span>
            <h1>{bug.name}</h1>
          </div>
          <div className="code-intro">This is your code:</div>
          <CodeBlock file={bug.codeFile} tokens={bug.code}/>
          <div className="invariant">
            <div>
              <div className="lab">What should never happen</div>
              <p className="stmt">"{bug.invariant}"</p>
            </div>
          </div>
        </div>
        <div className="vsec-cta-wrap">
          <ActionCTA onClick={() => scrollToSection(1)}>
            Deploy Your Code on Antithesis
          </ActionCTA>
        </div>
      </section>

      {/* SECTION 2 — branching tree */}
      <section ref={sec2Ref} className="vsec vsec-tree" id="sec-tree">
        <div className="vsec-inner">
          <FindIt bug={bug} onDebug={() => scrollToSection(2)}/>
        </div>
        <div className="vsec-cta-wrap">
          <ActionCTA onClick={() => scrollToSection(2)}>
            See What Antithesis Caught
          </ActionCTA>
        </div>
      </section>

      {/* SECTION 3 — verdict + caught bug animation */}
      <section ref={sec3Ref} className="vsec vsec-caught" id="sec-caught">
        <div className="vsec-inner caught-inner">
          <div className="caught-verdict">
            <div className="verdict-tag">What Antithesis did</div>
            <h2 className="verdict-text">
              <span className="em">Antithesis</span>{renderVerdict(bug.verdict)}
            </h2>
          </div>
          <div className="caught-anim">
            <Viz/>
          </div>
        </div>
      </section>

      {/* Internal nav bar */}
      <nav className="vnav">
        {[
          { lbl: 'Code', i: 0 },
          { lbl: 'Find it', i: 1 },
          { lbl: 'Caught', i: 2 },
        ].map((s) => (
          <button
            key={s.i}
            className={'vnav-btn' + (activeIdx === s.i ? ' active' : '')}
            onClick={() => scrollToSection(s.i)}>
            <span className="vnav-num">{s.i + 1}</span>
            <span className="vnav-lbl">{s.lbl}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// Big inline action button used between sections
function ActionCTA({ children, onClick }) {
  return (
    <button className="action-cta" onClick={onClick}>
      <span className="action-cta-text">{children}</span>
      <span className="action-cta-arrow">↓</span>
    </button>
  );
}

function App() {
  const [screen, setScreen] = useState({ name: 'picker' });
  return (
    <>
      <div className="chrome">
        <div className="brand"><span className="b">{'{'}</span><span className="bug">🐛</span><span className="b">{'}'}</span>&nbsp;antithesis</div>
      </div>
      {screen.name === 'picker' && <Picker onPick={(id) => setScreen({ name: 'deep', id })}/>}
      {screen.name === 'deep' && <DeepDive id={screen.id} onBack={() => setScreen({ name: 'picker' })}/>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
