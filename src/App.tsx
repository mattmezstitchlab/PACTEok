import { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Plus, Check, Clock3, CalendarDays, MapPin, Copy, X, ChevronRight, PenLine, Bell, ShieldCheck, LogOut, BriefcaseBusiness, Heart, Link2, AlertCircle, Trash2, CheckCircle2, Menu, FileText, LockKeyhole } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import supabase from './lib/supabase';
import { handleGoogleRedirect, signInWithGoogle } from './lib/googleAuth';
handleGoogleRedirect();
type Wedding={id:string;partner_names:string;date:string;venue:string};
type Vendor={id:string;wedding_id:string;name:string;trade:string;email:string;desired_service:string};
type Pact={id:string;wedding_id:string;vendor_id:string|null;initiator_role:string;client_user_id:string;provider_email:string;provider_name:string;trade:string;service_title:string;description:string;start_time:string;end_time:string;amount:number;deposit:number;status:string;client_signed_at:string|null;provider_signed_at:string|null;replaces_pact_id:string|null;created_at:string};
type TimelineItem={id:string;wedding_id:string;time:string;title:string};
type PactRequest={id:string;pact_id:string;type:string;reason:string;proposed_date:string|null;requested_by:string;status:string;created_at:string};
type Payment={id:string;pact_id:string;label:string;amount:number;due_date:string|null;status:string};
const fmt=(d:string)=>{if(!d)return '';const parts=d.split('-');return parts.length===3?new Date(+parts[0],+parts[1]-1,+parts[2]).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}):d};
const euro=(n:number)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0);
const labels:Record<string,string>={proposed:'À confirmer',awaiting_client:'Signature du couple attendue',awaiting_provider:'Signature du prestataire attendue',signed:'Signé',superseded:'Remplacé',cancelled:'Annulé',rejected:'Refusé'};
const requestLabels:Record<string,string>={cancellation:'Annulation',reschedule:'Report',change:'Modification'};
async function api<T=any>(path:string,method='GET',body?:unknown):Promise<T>{const {data:{session}}=await supabase.auth.getSession();const res=await fetch('/api/'+path,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||''}`},body:body?JSON.stringify(body):undefined});const data=await res.json();if(!res.ok)throw new Error(data.error||'Une erreur est survenue.');return data}
function Brand(){return <Link to="/" className="brand"><span className="brand-mark"><span/></span>PACTE<span className="brand-period">.</span></Link>}
function Shell({children,user,onSignOut}:{children:React.ReactNode;user?:User|null;onSignOut?:()=>void}){const [menu,setMenu]=useState(false);return <><header className="site-header"><div className="header-inner"><Brand/><nav className={menu?'header-nav open':'header-nav'}>{user?<><Link to="/espace" onClick={()=>setMenu(false)}>Mon espace</Link><Link to="/prestataire" onClick={()=>setMenu(false)}>Espace prestataire</Link><span className="nav-email">{user.email}</span><button className="nav-logout" onClick={onSignOut} aria-label="Se déconnecter"><LogOut size={17}/></button></>:<><Link to="/connexion?role=couple" onClick={()=>setMenu(false)}>Espace mariés</Link><Link to="/connexion?role=provider" onClick={()=>setMenu(false)}>Espace prestataire</Link></>}</nav><button className="mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Ouvrir le menu"><Menu size={22}/></button></div></header>{children}<footer className="footer"><div className="footer-inner"><div><Brand/><p>Contrat. Timeline. PACTE.</p></div><p>PACTE structure et suit les engagements. Il ne garantit pas leur portée ou leur issue juridique.</p><span>© 2026 PACTE</span></div></footer></>}
/* ---------- Aperçus de l’application réelle, rendus dans un cadre iPhone ----------
   Le contenu de ces écrans reprend les vrais libellés, statuts et sections de
   l’application (voir PactPage, WeddingPage, PactForm et api/weddings.js).      */
function Phone({children,className=''}:{children:React.ReactNode;className?:string}){
  return <div className={'phone '+className}><div className="phone-screen">{children}</div></div>;
}
function ScrBar(){return <div className="scr-bar"><span>9:41</span><i>▮▮▮</i></div>}
function ScrNav(){return <div className="scr-nav"><span className="scr-brand"><b/>PACTE<i>.</i></span><span className="scr-avatar"/></div>}

function ScreenTimeline(){
  return <><ScrBar/><ScrNav/><div className="scr-body">
    <div className="scr-kicker">Le mariage</div>
    <div className="scr-h1">Camille & Alex</div>
    <div className="scr-meta">19 juin 2027 · Domaine de Vaux</div>
    <div className="scr-tabs"><b>Timeline</b><span>PACTEs</span><span>Prestataires</span></div>
    {[['10:00','Préparatifs','Moment de la journée',false],
      ['12:00','Cérémonie','Moment de la journée',false],
      ['14:00','Reportage photo','Studio Lumière · 14:00 – 21:00',true],
      ['19:30','Dîner','Moment de la journée',false]].map(([t,title,sub,signed],i,a)=>
      <div className="scr-row" key={t as string}>
        <div className="scr-time">{t}</div>
        <div className="scr-track"><span className={signed?'scr-dot on':'scr-dot'}/>{i<a.length-1&&<span className="scr-line"/>}</div>
        <div className="scr-entry">
          <div><strong>{title}</strong><small>{sub}</small></div>
          {signed?<span className="scr-tag"><LockKeyhole size={8}/> PACTE signé</span>:null}
        </div>
      </div>)}
  </div></>;
}

function ScreenPact(){
  return <><ScrBar/>
    <div className="scr-doc-top"><span className="scr-brand"><b/>PACTE<i>.</i></span><span className="scr-pill scr-pill-ok">Signé</span></div>
    <div className="scr-sec">
      <div className="scr-kicker">La prestation</div>
      <div className="scr-h2">Reportage photo</div>
      <p>De la cérémonie au dîner. Galerie livrée sous 30 jours.</p>
      <div className="scr-facts">
        <div><small>Date</small><strong>19 juin 2027</strong></div>
        <div><small>Horaires</small><strong>14:00 – 21:00</strong></div>
      </div>
    </div>
    <div className="scr-sec">
      <div className="scr-kicker">Conditions financières</div>
      <div className="scr-amount"><span>Montant convenu</span><b>2 400 €</b></div>
      <div className="scr-amount sec"><span>Acompte prévu</span><b>600 €</b></div>
    </div>
    <div className="scr-sec">
      <div className="scr-kicker">Signatures</div>
      <div className="scr-sigs">
        <div className="ok"><small>Le couple</small><strong>Signé</strong></div>
        <div className="ok"><small>Le prestataire</small><strong>Signé</strong></div>
      </div>
    </div>
    <div className="scr-foot"><LockKeyhole size={9}/> Document de suivi des engagements.</div>
  </>;
}

function ScreenPactList(){
  return <><ScrBar/><ScrNav/><div className="scr-body">
    <div className="scr-kicker">Vos engagements</div>
    <div className="scr-h1">Les PACTEs</div>
    <div className="scr-list">
      {[['Reportage photo','Studio Lumière','Signé','ok'],
        ['DJ & sonorisation','Nuit Sonore','Signature du prestataire attendue','wait'],
        ['Fleurs & décoration','Atelier Camélia','À confirmer','wait'],
        ['Traiteur','Maison Berger','Signé','ok']].map(([t,who,st,kind])=>
        <div className="scr-li" key={t as string}>
          <span className="scr-ico"><FileText size={12}/></span>
          <span className="scr-li-info"><strong>{t}</strong><small>{who}</small></span>
          <span className={kind==='ok'?'scr-pill scr-pill-ok':'scr-pill scr-pill-wait'}>{st}</span>
        </div>)}
    </div>
  </div></>;
}

function ScreenProvider(){
  return <><ScrBar/><ScrNav/><div className="scr-body">
    <div className="scr-kicker">Espace prestataire</div>
    <div className="scr-h1">Vos engagements</div>
    <div className="scr-banner">
      <Bell size={13}/>
      <span><strong>1 action à effectuer</strong><small>Un PACTE attend votre signature.</small></span>
    </div>
    <div className="scr-list">
      {[['Reportage photo','Camille & Alex · 19 juin 2027','À confirmer','wait'],
        ['Séance engagement','Léa & Sam · 4 sept. 2027','Signé','ok'],
        ['Reportage complet','Inès & Théo · 11 sept. 2027','Signé','ok']].map(([t,who,st,kind])=>
        <div className="scr-li" key={who as string}>
          <span className="scr-ico"><CalendarDays size={12}/></span>
          <span className="scr-li-info"><strong>{t}</strong><small>{who}</small></span>
          <span className={kind==='ok'?'scr-pill scr-pill-ok':'scr-pill scr-pill-wait'}>{st}</span>
        </div>)}
    </div>
  </div></>;
}

function ScreenForm(){
  return <><ScrBar/>
    <div className="scr-doc-top"><span className="scr-h2" style={{margin:0}}>Nouveau PACTE</span><X size={13}/></div>
    <div className="scr-body">
      <p style={{fontSize:'8.5px',color:'var(--muted)',lineHeight:1.5}}>Le PACTE est une proposition. Il n’entre dans les Timelines qu’après les deux signatures.</p>
      <div className="scr-field"><label>Nom du prestataire</label><div className="scr-input">Studio Lumière</div></div>
      <div className="scr-field"><label>Prestation</label><div className="scr-input">Reportage photo de la journée</div></div>
      <div className="scr-field scr-cols">
        <div><label>Début</label><div className="scr-input">14:00</div></div>
        <div><label>Fin</label><div className="scr-input">21:00</div></div>
      </div>
      <div className="scr-field scr-cols">
        <div><label>Montant convenu (€)</label><div className="scr-input">2400</div></div>
        <div><label>Acompte prévu (€)</label><div className="scr-input">600</div></div>
      </div>
      <div className="scr-cta">Créer la proposition</div>
    </div>
  </>;
}

/* Objet de marque du héros : carte en dégradé avec une légère inclinaison 3D
   suivant la souris. Volontairement abstrait — il ne simule aucun document réel. */
function PacteCard(){
  const ref=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    const el=ref.current;
    if(!el) return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if(window.matchMedia('(hover: none)').matches) return;
    const onMove=(e:MouseEvent)=>{
      const dx=(e.clientX-window.innerWidth/2)/(window.innerWidth/2);
      const dy=(e.clientY-window.innerHeight/2)/(window.innerHeight/2);
      el.style.setProperty('--ry',(dx*11).toFixed(2)+'deg');
      el.style.setProperty('--rx',(dy*-8).toFixed(2)+'deg');
    };
    window.addEventListener('mousemove',onMove,{passive:true});
    return()=>window.removeEventListener('mousemove',onMove);
  },[]);
  return <div className="pacte-card" ref={ref}>
    <div className="pacte-card-inner">
      <div className="pc-top"><span className="pc-brand"><b/>PACTE<i>.</i></span><span className="pc-chip"/></div>
      <div className="pc-foot">
        <span><Check size={11}/> Le couple</span>
        <span><Check size={11}/> Le prestataire</span>
      </div>
    </div>
  </div>;
}

/* Bande à défilement : le téléphone reste fixé pendant que les blocs de texte
   défilent, et l'écran affiché change au passage de chaque bloc. */
type Step={title:React.ReactNode;body:string;screen:React.ReactNode};
function StickyBand({tone,label,title,intro,steps,reverse}:{tone:'mint'|'blush';label:string;title:string;intro:string;steps:Step[];reverse?:boolean}){
  const [active,setActive]=useState(0);
  const refs=useRef<(HTMLDivElement|null)[]>([]);
  useEffect(()=>{
    const els=refs.current.filter(Boolean) as HTMLDivElement[];
    if(!els.length||typeof IntersectionObserver==='undefined') return;
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); });
    },{rootMargin:'-45% 0px -45% 0px'});
    els.forEach(el=>io.observe(el));
    return()=>io.disconnect();
  },[]);
  return <section className={'band band-'+tone}>
    <div className="band-inner">
      <div className="band-intro">
        <span className="band-label">{label}</span>
        <h3>{title}</h3>
        <p>{intro}</p>
      </div>
      <div className={reverse?'sticky-band rev':'sticky-band'}>
        <div className="sticky-media">
          <Phone>{steps.map((s,i)=><div key={i} className={i===active?'scr-layer on':'scr-layer'} aria-hidden={i!==active}>{s.screen}</div>)}</Phone>
        </div>
        <div className="sticky-steps">
          {steps.map((s,i)=>
            <div key={i} data-i={i} ref={el=>{refs.current[i]=el}} className={i===active?'sticky-step on':'sticky-step'}>
              <div className="sticky-step-phone"><Phone>{s.screen}</Phone></div>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </div>)}
        </div>
      </div>
    </div>
  </section>;
}

function Home({user}:{user:User|null}){
  const coupleHref=user?'/espace':'/connexion?role=couple';
  const providerHref=user?'/prestataire':'/connexion?role=provider';
  return <Shell user={user} onSignOut={()=>supabase.auth.signOut()}>

    <main className="hero">
      <div className="hero-inner">
        <div className="hero-copy">
          <span className="eyebrow"><span className="tiny-dot"/>Contrat + jour J</span>
          <h1>Un accord.<br/>Un jour J.<br/><em>Un seul endroit.</em></h1>
          <p className="hero-sub">L’accord de prestation et le déroulé du jour J, dans la même application. Une prestation n’entre dans la Timeline qu’une fois signée des deux côtés.</p>
          <div className="hero-actions">
            <Link className="btn btn-dark" to={coupleHref}>Créer mon mariage <ArrowRight size={17}/></Link>
            <Link className="btn btn-outline" to={providerHref}>Je suis prestataire</Link>
          </div>
          <div><Link className="received-link" to={providerHref}>J’ai reçu un PACTE <ChevronRight size={15}/></Link></div>
        </div>
        <div className="hero-stage">
          <span className="hero-blob hero-blob-1"/>
          <span className="hero-blob hero-blob-2"/>
          <Phone className="phone-a"><ScreenTimeline/></Phone>
          <Phone className="phone-b"><ScreenPact/></Phone>
          <PacteCard/>
        </div>
      </div>
    </main>

    <section className="statement">
      <div className="statement-inner">
        <div className="statement-icons"><span><FileText size={19}/></span><span><CalendarDays size={19}/></span></div>
        <p>PACTE tient deux choses au même endroit : l’accord signé entre le couple et le prestataire, <span className="dim">et le déroulé du jour J qui en découle.</span></p>
      </div>
    </section>

    <div className="display-head"><h2>Signer<span className="dh-dot dh-mint"/><br/>ensemble</h2></div>

    <StickyBand
      tone="mint"
      label="Le PACTE"
      title="Un accord, deux signatures."
      intro="Tant qu’il en manque une, rien n’est engagé."
      steps={[
        {title:<>Proposez.<br/><span>En quelques champs.</span></>,
         body:'La prestation, les horaires, le montant et l’acompte. Le couple comme le prestataire peuvent être à l’initiative de l’accord.',
         screen:<ScreenForm/>},
        {title:<>Signé des deux côtés,<br/><span>ou rien du tout.</span></>,
         body:'Chaque signature est horodatée. Une fois les deux enregistrées, le document est figé : plus aucune modification directe n’est possible.',
         screen:<ScreenPact/>},
        {title:<>Chaque statut<br/><span>est dit clairement.</span></>,
         body:'À confirmer, signature attendue, signé, annulé. Personne n’a besoin de relancer pour savoir où en est un accord.',
         screen:<ScreenPactList/>},
      ]}/>

    <div className="display-head"><h2>Suivre<span className="dh-dot dh-blush"/><br/>le jour J</h2></div>

    <StickyBand
      tone="blush"
      reverse
      label="La Timeline"
      title="Le déroulé se remplit tout seul."
      intro="Un PACTE signé devient une ligne de la journée."
      steps={[
        {title:<>Le jour J,<br/><span>heure par heure.</span></>,
         body:'Vos moments et vos prestations signées sur une seule ligne de temps. Les propositions non signées n’y figurent pas.',
         screen:<ScreenTimeline/>},
        {title:<>Côté prestataire<br/><span>aussi.</span></>,
         body:'Le prestataire retrouve ses engagements signés, toutes dates confondues, et ce qui attend encore sa signature.',
         screen:<ScreenProvider/>},
      ]}/>

    <section className="why">
      <div className="why-inner">
        <h2>Pourquoi PACTE</h2>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-visual why-v-mint"><div className="mini-stack">
              <div className="mini-chip"><div className="mini-row"><span>Le couple</span><strong>Signé</strong></div><div className="mini-row"><span>Le prestataire</span><strong>Signé</strong></div></div>
            </div></div>
            <div className="why-body"><h3>Ce qui est signé ne bouge plus</h3><p>Un PACTE signé ne peut pas être modifié directement. Changer les conditions crée une nouvelle version ; l’originale reste intacte jusqu’aux deux nouvelles signatures.</p></div>
          </div>
          <div className="why-card">
            <div className="why-visual why-v-blush"><div className="mini-stack">
              <div className="mini-chip"><div className="mini-row"><span>14:00 – 21:00</span><strong>Reportage photo</strong></div></div>
              <div className="mini-chip"><div className="mini-row"><span>18:00 – 23:00</span><strong style={{color:'var(--danger)'}}>Conflit d’horaire</strong></div></div>
            </div></div>
            <div className="why-body"><h3>Pas de double réservation</h3><p>À la signature, PACTE compare les autres engagements signés du prestataire à la même date et refuse tout chevauchement de créneau.</p></div>
          </div>
          <div className="why-card">
            <div className="why-visual why-v-sand"><div className="mini-stack">
              <div className="mini-chip"><div className="mini-row"><span>Demande de report</span><span className="scr-pill scr-pill-wait">En attente</span></div><div className="mini-row"><span>Réponse</span><strong>L’autre partie</strong></div></div>
            </div></div>
            <div className="why-body"><h3>Rien ne change tout seul</h3><p>Report, modification, annulation : chaque demande doit être acceptée par l’autre signataire. Personne ne valide sa propre demande.</p></div>
          </div>
          <div className="why-card">
            <div className="why-visual why-v-ink"><div className="mini-stack">
              <div className="mini-chip"><div className="mini-row"><span>Acompte</span><strong>600 €</strong></div><div className="mini-row"><span>Solde</span><strong>1 800 €</strong></div></div>
            </div></div>
            <div className="why-body"><h3>Les jalons au clair</h3><p>Suivez ce qui est réglé et ce qui reste dû, jalon par jalon. PACTE ne traite aucun paiement : il ne fait que le suivi.</p></div>
          </div>
        </div>
      </div>
    </section>

    <section className="how">
      <div className="how-inner">
        <h2>Comment ça tient</h2>
        <div className="how-grid">
          <div className="how-card"><span><ShieldCheck size={17}/></span><h3>Double signature</h3><p>Aucun accord n’existe tant que les deux parties n’ont pas validé.</p></div>
          <div className="how-card"><span><Clock3 size={17}/></span><h3>Horodatage</h3><p>Chaque validation est enregistrée avec sa date et son heure.</p></div>
          <div className="how-card"><span><Link2 size={17}/></span><h3>Code de mariage</h3><p>Un prestataire rejoint un mariage avec le code transmis par le couple.</p></div>
          <div className="how-card"><span><LockKeyhole size={17}/></span><h3>Versions successives</h3><p>Une nouvelle version remplace l’ancienne seulement une fois signée.</p></div>
        </div>
        <div className="how-cta"><Link className="btn btn-dark" to={coupleHref}>Commencer avec PACTE <ArrowRight size={17}/></Link></div>
      </div>
    </section>

    <div className="wordmark"><span>PACTE</span></div>
  </Shell>;
}
function Auth({user}:{user:User|null}){const nav=useNavigate();const params=new URLSearchParams(location.search);const role=params.get('role')==='provider'?'provider':'couple';const next=params.get('next');const [signup,setSignup]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[success,setSuccess]=useState('');useEffect(()=>{if(user)nav(next&&next.startsWith('/')?next:role==='provider'?'/prestataire':'/espace',{replace:true})},[user,nav,role,next]);async function submit(e:React.FormEvent){e.preventDefault();setError('');setSuccess('');if(!email.includes('@'))return setError('Saisissez une adresse e-mail valide.');if(password.length<6)return setError('Le mot de passe doit contenir au moins 6 caractères.');setBusy(true);const {data,error:err}=signup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});setBusy(false);if(err)setError(err.message);else if(signup&&!data.session)setSuccess('Compte créé. Consultez votre e-mail pour confirmer votre adresse.');else nav(next&&next.startsWith('/')?next:role==='provider'?'/prestataire':'/espace')}
return <Shell user={user}><main className="auth-layout"><div className="auth-intro"><span className="eyebrow">Bienvenue sur PACTE</span><h1>{role==='provider'?'Vos prestations, au clair.':'Votre mariage, l’esprit clair.'}</h1><p>Un espace simple pour vos accords et votre jour J. Ce qui est signé est ce qui compte.</p><div className="auth-deco"><span className="deco-line"/><span>UN ACCORD. DEUX SIGNATURES.</span></div></div><div className="auth-card"><div className="auth-icon">{role==='provider'?<BriefcaseBusiness size={22}/>:<Heart size={22}/>}</div><h2>{signup?'Créer mon compte':'Ravi de vous revoir.'}</h2><p>{role==='provider'?'Espace prestataire':'Espace mariage'} · {signup?'Rejoignez PACTE en quelques secondes.':'Connectez-vous pour continuer.'}</p><form onSubmit={submit}><label>Adresse e-mail<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.fr" required/></label><label>Mot de passe<input type="password" autoComplete={signup?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="6 caractères minimum" required minLength={6}/></label>{error&&<div className="alert error"><AlertCircle size={16}/>{error}</div>}{success&&<div className="alert success"><Check size={16}/>{success}</div>}<button className="btn btn-dark full" disabled={busy}>{busy?'Un instant…':signup?'Créer mon compte':'Se connecter'} <ArrowRight size={17}/></button></form><div className="auth-divider">ou</div><button className="btn btn-google full" onClick={()=>{if(!signInWithGoogle())setError('Connexion Google indisponible pour le moment. Utilisez votre adresse e-mail.')}}><span className="google-g">G</span> Continuer avec Google</button><div className="auth-switch">{signup?'Déjà un compte ?':'Pas encore de compte ?'} <button onClick={()=>{setSignup(!signup);setError('');setSuccess('')}}>{signup?'Se connecter':'Créer un compte'}</button></div></div></main></Shell>}
function Loading(){return <div className="loading"><span className="spinner"/> Chargement de votre espace…</div>}
function Toast({message,onClose}:{message:string;onClose:()=>void}){return message?<div className="toast"><AlertCircle size={18}/>{message}<button onClick={onClose}><X size={16}/></button></div>:null}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal"><div className="modal-head"><h2>{title}</h2><button onClick={onClose} aria-label="Fermer"><X size={20}/></button></div>{children}</div></div>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="field">{label}{children}</label>}
function Dashboard({user}:{user:User}){const nav=useNavigate();const [weddings,setWeddings]=useState<Wedding[]>([]),[pacts,setPacts]=useState<Pact[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[showCreate,setShowCreate]=useState(false),[busy,setBusy]=useState(false);const [form,setForm]=useState({partner_names:'',date:'',venue:''});async function load(){try{const [w,p]=await Promise.all([api<Wedding[]>('weddings'),api<Pact[]>('pacts')]);setWeddings(w);setPacts(p)}catch(e:any){setError(e.message)}finally{setLoading(false)}}useEffect(()=>{load()},[]);async function create(e:React.FormEvent){e.preventDefault();setBusy(true);try{const w=await api<Wedding>('weddings','POST',form);setShowCreate(false);nav('/mariage/'+w.id)}catch(e:any){setError(e.message)}finally{setBusy(false)}}const actions=pacts.filter(p=>p.client_user_id===user.id&&!p.client_signed_at&&['proposed','awaiting_client'].includes(p.status));return <Shell user={user} onSignOut={()=>supabase.auth.signOut()}><main className="workspace"><div className="page-heading"><div><span className="eyebrow">Votre espace</span><h1>Bonjour<span className="accent-dot">.</span></h1><p>Vos mariages et les engagements qui comptent.</p></div><button className="btn btn-dark" onClick={()=>setShowCreate(true)}><Plus size={18}/> Créer un mariage</button></div>{loading?<Loading/>:<>{actions.length>0&&<div className="action-banner"><div className="banner-icon"><Bell size={20}/></div><div><strong>{actions.length} action{actions.length>1?'s':''} vous attend{actions.length>1?'ent':''}</strong><p>Un PACTE a besoin de votre signature.</p></div><Link to={'/pacte/'+actions[0].id} className="btn btn-small btn-white">Voir le PACTE <ArrowRight size={15}/></Link></div>}<div className="content-head"><h2>Mes mariages <span>{weddings.length}</span></h2></div>{weddings.length?<div className="wedding-grid">{weddings.map(w=><Link className="wedding-card" key={w.id} to={'/mariage/'+w.id}><div className="wedding-card-top"><span className="wedding-card-icon"><Heart size={20}/></span><span className="section-kicker">Ouvrir</span></div><h3>{w.partner_names}</h3><div className="wedding-card-meta"><span><CalendarDays size={15}/>{fmt(w.date)}</span><span><MapPin size={15}/>{w.venue}</span></div><div className="wedding-card-foot">Timeline <ArrowRight size={16}/></div></Link>)}</div>:<div className="empty"><span className="empty-icon"><Heart size={26}/></span><h3>Tout commence ici.</h3><p>Créez votre mariage pour organiser votre journée et vos engagements.</p><button className="btn btn-dark" onClick={()=>setShowCreate(true)}>Créer mon mariage <ArrowRight size={17}/></button></div>}</>}{showCreate&&<Modal title="Votre mariage" onClose={()=>setShowCreate(false)}><form onSubmit={create} className="modal-form"><p className="form-intro">Trois informations pour poser les premières bases.</p><Field label="Vos prénoms"><input required placeholder="Camille & Alex" value={form.partner_names} onChange={e=>setForm({...form,partner_names:e.target.value})}/></Field><div className="form-row"><Field label="Date"><input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field><Field label="Lieu"><input required placeholder="Paris, France" value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})}/></Field></div><button className="btn btn-dark full" disabled={busy}>{busy?'Création…':'Créer mon mariage'} <ArrowRight size={17}/></button></form></Modal>}<Toast message={error} onClose={()=>setError('')}/></main></Shell>}
function PactForm({wedding,vendors,onDone,onClose,replaces}:{wedding?:Wedding;vendors?:Vendor[];onDone:()=>void;onClose:()=>void;replaces?:Pact}){const [weddingId,setWeddingId]=useState(wedding?.id||replaces?.wedding_id||''),[vendorId,setVendorId]=useState(replaces?.vendor_id||''),[providerName,setProviderName]=useState(replaces?.provider_name||''),[providerEmail,setProviderEmail]=useState(replaces?.provider_email||''),[trade,setTrade]=useState(replaces?.trade||''),[service,setService]=useState(replaces?.service_title||''),[description,setDescription]=useState(replaces?.description||''),[start,setStart]=useState(replaces?.start_time||''),[end,setEnd]=useState(replaces?.end_time||''),[amount,setAmount]=useState(String(replaces?.amount??'')),[deposit,setDeposit]=useState(String(replaces?.deposit??'0')),[error,setError]=useState(''),[busy,setBusy]=useState(false);const isClient=!!wedding;useEffect(()=>{if(!isClient)supabase.auth.getUser().then(({data})=>setProviderEmail(data.user?.email||''))},[isClient]);function pickVendor(id:string){setVendorId(id);const v=vendors?.find(v=>v.id===id);if(v){setProviderName(v.name);setProviderEmail(v.email);setTrade(v.trade);setService(v.desired_service)}}async function submit(e:React.FormEvent){e.preventDefault();if(start>=end)return setError('L’heure de fin doit être après l’heure de début.');if(Number(deposit)>Number(amount))return setError('L’acompte ne peut pas dépasser le montant total.');setBusy(true);setError('');try{await api('pacts','POST',{wedding_id:weddingId.trim(),vendor_id:vendorId||null,provider_name:providerName,provider_email:providerEmail,trade,service_title:service,description,start_time:start,end_time:end,amount:Number(amount),deposit:Number(deposit),initiator_role:isClient?'client':'provider',replaces_pact_id:replaces?.id||null});onDone()}catch(e:any){setError(e.message)}finally{setBusy(false)}}return <form className="modal-form" onSubmit={submit}><p className="form-intro">Le PACTE est une proposition. Il n’entre dans les Timelines qu’après les deux signatures.</p>{!isClient&&<Field label="Code du mariage"><input required placeholder="Collez l’identifiant partagé par le couple" value={weddingId} onChange={e=>setWeddingId(e.target.value)}/></Field>}{isClient&&!!vendors?.length&&<Field label="Choisir un prestataire enregistré (facultatif)"><select value={vendorId} onChange={e=>pickVendor(e.target.value)}><option value="">Renseigner manuellement</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.name} · {v.trade}</option>)}</select></Field>}<div className="form-row"><Field label="Nom du prestataire"><input required value={providerName} onChange={e=>setProviderName(e.target.value)} placeholder="Studio Lumière"/></Field><Field label="Métier"><input value={trade} onChange={e=>setTrade(e.target.value)} placeholder="Photographe"/></Field></div><Field label="E-mail du prestataire"><input required type="email" value={providerEmail} onChange={e=>setProviderEmail(e.target.value)} placeholder="contact@studio.fr" readOnly={!isClient}/></Field>{!isClient&&<p className="field-note">Votre adresse de connexion est utilisée comme e-mail prestataire.</p>}<Field label="Prestation"><input required value={service} onChange={e=>setService(e.target.value)} placeholder="Reportage photo de la journée"/></Field><Field label="Détails de la prestation"><textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Livrables, périmètre, conditions convenues…"/></Field><div className="form-row"><Field label="Début"><input required type="time" value={start} onChange={e=>setStart(e.target.value)}/></Field><Field label="Fin"><input required type="time" value={end} onChange={e=>setEnd(e.target.value)}/></Field></div><div className="form-row"><Field label="Montant convenu (€)"><input required type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></Field><Field label="Acompte prévu (€)"><input type="number" min="0" step="0.01" value={deposit} onChange={e=>setDeposit(e.target.value)}/></Field></div>{error&&<div className="alert error"><AlertCircle size={16}/>{error}</div>}<div className="modal-actions"><button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button><button className="btn btn-dark" disabled={busy}>{busy?'Enregistrement…':'Créer la proposition'} <ArrowRight size={17}/></button></div></form>}
function WeddingPage({user}:{user:User}){const {id}=useParams();const [wedding,setWedding]=useState<Wedding|null>(null),[vendors,setVendors]=useState<Vendor[]>([]),[pacts,setPacts]=useState<Pact[]>([]),[items,setItems]=useState<TimelineItem[]>([]),[requests,setRequests]=useState<PactRequest[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[tab,setTab]=useState<'timeline'|'pacts'|'vendors'>('timeline'),[modal,setModal]=useState<'pact'|'vendor'|'event'|'editWedding'|null>(null),[editItem,setEditItem]=useState<TimelineItem|null>(null),[event,setEvent]=useState({time:'',title:''}),[vendor,setVendor]=useState({name:'',trade:'',email:'',desired_service:''}),[editWedding,setEditWedding]=useState({partner_names:'',date:'',venue:''}),[busy,setBusy]=useState(false),[copied,setCopied]=useState(false);async function load(){try{const [ws,vs,ps,ts,rs]=await Promise.all([api<Wedding[]>('weddings'),api<Vendor[]>('vendors?wedding_id='+id),api<Pact[]>('pacts'),api<{items:TimelineItem[];pacts:Pact[]}>('timeline?wedding_id='+id),api<PactRequest[]>('requests')]);const w=ws.find(x=>x.id===id);if(!w)throw new Error('Mariage introuvable.');setWedding(w);setEditWedding({partner_names:w.partner_names,date:w.date,venue:w.venue});setVendors(vs);setPacts(ps.filter(p=>p.wedding_id===id));setItems(ts.items);setRequests(rs)}catch(e:any){setError(e.message)}finally{setLoading(false)}}useEffect(()=>{load()},[id]);const entries=useMemo(()=>[...items.map(x=>({key:'i'+x.id,time:x.time,end:'',title:x.title,subtitle:'Moment de la journée',pact:null as Pact|null,item:x})),...pacts.filter(p=>p.status==='signed').map(p=>({key:'p'+p.id,time:p.start_time,end:p.end_time,title:p.service_title,subtitle:p.provider_name,pact:p,item:null as TimelineItem|null}))].sort((a,b)=>a.time.localeCompare(b.time)),[items,pacts]);const actionCount=pacts.filter(p=>!p.client_signed_at&&['proposed','awaiting_client'].includes(p.status)).length+requests.filter(r=>r.status==='pending'&&r.requested_by!==user.id&&pacts.some(p=>p.id===r.pact_id)).length;
async function saveVendor(e:React.FormEvent){e.preventDefault();setBusy(true);try{await api('vendors','POST',{wedding_id:id,...vendor});setModal(null);setVendor({name:'',trade:'',email:'',desired_service:''});await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}}async function saveEvent(e:React.FormEvent){e.preventDefault();setBusy(true);try{await api('timeline',editItem?'PUT':'POST',{wedding_id:id,id:editItem?.id,...event});setModal(null);setEditItem(null);setEvent({time:'',title:''});await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}}async function deleteEvent(item:TimelineItem){if(!confirm('Supprimer ce moment de la Timeline ?'))return;try{await api('timeline','DELETE',{wedding_id:id,id:item.id});await load()}catch(e:any){setError(e.message)}}async function deleteVendor(v:Vendor){if(!confirm(`Retirer ${v.name} ?`))return;try{await api('vendors','DELETE',{wedding_id:id,id:v.id});await load()}catch(e:any){setError(e.message)}}async function saveWedding(e:React.FormEvent){e.preventDefault();setBusy(true);try{await api('weddings','PUT',{id,...editWedding});setModal(null);await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}}function copyCode(){navigator.clipboard.writeText(id||'').then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2400)}).catch(()=>setError('Impossible de copier le code.'))}
return <Shell user={user} onSignOut={()=>supabase.auth.signOut()}><main className="workspace">{loading?<Loading/>:wedding?<><Link to="/espace" className="back-link"><ArrowLeft size={16}/> Mes mariages</Link><div className="wedding-heading"><div><span className="eyebrow">Le mariage</span><h1>{wedding.partner_names}<span className="accent-dot">.</span></h1><div className="heading-meta"><span><CalendarDays size={16}/>{fmt(wedding.date)}</span><span><MapPin size={16}/>{wedding.venue}</span><button onClick={()=>setModal('editWedding')} className="text-button"><PenLine size={14}/> Modifier</button></div></div><button className="btn btn-dark" onClick={()=>setModal('pact')}><Plus size={18}/> Créer un PACTE</button></div><div className="code-strip"><div className="code-icon"><Link2 size={18}/></div><div><strong>Code du mariage</strong><p>Transmettez ce code à un prestataire pour qu’il puisse vous proposer un PACTE.</p></div><button onClick={copyCode} className="code-copy">{copied?'Copié !':id?.slice(0,8)+'…'} {copied?<Check size={15}/>:<Copy size={15}/>}</button></div>{actionCount>0&&<div className="action-banner compact"><div className="banner-icon"><Bell size={19}/></div><div><strong>{actionCount} action{actionCount>1?'s':''} en attente</strong><p>Ouvrez les PACTEs pour signer ou répondre aux demandes.</p></div><button className="btn btn-small btn-white" onClick={()=>setTab('pacts')}>Voir les PACTEs <ArrowRight size={15}/></button></div>}<div className="tabs"><button className={tab==='timeline'?'active':''} onClick={()=>setTab('timeline')}>Timeline</button><button className={tab==='pacts'?'active':''} onClick={()=>setTab('pacts')}>PACTEs <span>{pacts.length}</span></button><button className={tab==='vendors'?'active':''} onClick={()=>setTab('vendors')}>Prestataires <span>{vendors.length}</span></button></div>{tab==='timeline'&&<section className="panel"><div className="panel-head"><div><span className="section-kicker">Le jour J</span><h2>Votre Timeline</h2><p>Les prestations apparaissent ici uniquement après signature des deux parties.</p></div><button className="btn btn-outline btn-small" onClick={()=>{setEditItem(null);setEvent({time:'',title:''});setModal('event')}}><Plus size={16}/> Ajouter un moment</button></div><div className="timeline-list">{entries.length?entries.map((x,i)=><div className="timeline-row" key={x.key}><div className="timeline-time">{x.time}</div><div className="timeline-track"><span className={x.pact?'track-dot pact-dot':'track-dot'}/>{i<entries.length-1&&<span className="track-line"/>}</div><div className="timeline-entry"><div><h3>{x.title}</h3><p>{x.subtitle}{x.end?' · '+x.time+' – '+x.end:''}</p></div>{x.pact?<Link className="tag tag-green" to={'/pacte/'+x.pact.id}><LockKeyhole size={12}/> PACTE signé <ChevronRight size={13}/></Link>:<div className="row-actions"><button title="Modifier" onClick={()=>{setEditItem(x.item);setEvent({time:x.time,title:x.title});setModal('event')}}><PenLine size={16}/></button><button title="Supprimer" onClick={()=>deleteEvent(x.item!)}><Trash2 size={16}/></button></div>}</div></div>):<div className="empty small">Votre Timeline est vide. Ajoutez un premier moment.</div>}</div></section>}{tab==='pacts'&&<section className="panel"><div className="panel-head"><div><span className="section-kicker">Vos engagements</span><h2>Les PACTEs</h2><p>Un accord prend effet dans la Timeline après deux signatures.</p></div><button className="btn btn-outline btn-small" onClick={()=>setModal('pact')}><Plus size={16}/> Nouveau PACTE</button></div>{pacts.length?<div className="pact-list">{pacts.map(p=><Link className="pact-list-row" to={'/pacte/'+p.id} key={p.id}><span className="list-file"><FileText size={20}/></span><span className="list-info"><strong>{p.service_title}</strong><small>{p.provider_name} · {p.start_time} – {p.end_time}</small></span><span className={'status status-'+p.status}>{labels[p.status]||p.status}</span><ChevronRight size={18} className="row-chevron"/></Link>)}</div>:<div className="empty small"><FileText size={25}/><h3>Pas encore de PACTE.</h3><p>Proposez un accord clair à votre premier prestataire.</p><button className="btn btn-dark" onClick={()=>setModal('pact')}>Créer un PACTE <ArrowRight size={16}/></button></div>}</section>}{tab==='vendors'&&<section className="panel"><div className="panel-head"><div><span className="section-kicker">Votre équipe</span><h2>Prestataires</h2><p>Ajoutez-les dès maintenant, même s’ils n’ont pas encore de compte.</p></div><button className="btn btn-outline btn-small" onClick={()=>setModal('vendor')}><Plus size={16}/> Ajouter</button></div>{vendors.length?<div className="vendor-grid">{vendors.map(v=><div className="vendor-card" key={v.id}><div className="vendor-avatar">{v.name.charAt(0).toUpperCase()}</div><div className="vendor-details"><h3>{v.name}</h3><span>{v.trade}</span><p>{v.email}</p>{v.desired_service&&<small>{v.desired_service}</small>}</div><button onClick={()=>deleteVendor(v)} title="Retirer le prestataire"><Trash2 size={16}/></button></div>)}</div>:<div className="empty small"><BriefcaseBusiness size={25}/><h3>Votre équipe commence ici.</h3><p>Ajoutez un prestataire pour préparer votre premier PACTE.</p><button className="btn btn-dark" onClick={()=>setModal('vendor')}>Ajouter un prestataire <ArrowRight size={16}/></button></div>}</section>}</>:!error?<Loading/>:null}{modal==='pact'&&wedding&&<Modal title="Nouveau PACTE" onClose={()=>setModal(null)}><PactForm wedding={wedding} vendors={vendors} onClose={()=>setModal(null)} onDone={()=>{setModal(null);load();setTab('pacts')}}/></Modal>}{modal==='vendor'&&<Modal title="Ajouter un prestataire" onClose={()=>setModal(null)}><form className="modal-form" onSubmit={saveVendor}><p className="form-intro">Aucun compte n’est nécessaire pour préparer sa fiche.</p><div className="form-row"><Field label="Nom"><input required value={vendor.name} onChange={e=>setVendor({...vendor,name:e.target.value})} placeholder="Studio Lumière"/></Field><Field label="Métier"><input required value={vendor.trade} onChange={e=>setVendor({...vendor,trade:e.target.value})} placeholder="Photographe"/></Field></div><Field label="E-mail"><input type="email" required value={vendor.email} onChange={e=>setVendor({...vendor,email:e.target.value})} placeholder="contact@studio.fr"/></Field><Field label="Prestation souhaitée"><input value={vendor.desired_service} onChange={e=>setVendor({...vendor,desired_service:e.target.value})} placeholder="Reportage de la cérémonie au dîner"/></Field><button className="btn btn-dark full" disabled={busy}>Ajouter le prestataire <ArrowRight size={17}/></button></form></Modal>}{modal==='event'&&<Modal title={editItem?'Modifier ce moment':'Ajouter un moment'} onClose={()=>setModal(null)}><form className="modal-form" onSubmit={saveEvent}><div className="form-row"><Field label="Heure"><input type="time" required value={event.time} onChange={e=>setEvent({...event,time:e.target.value})}/></Field><Field label="Moment"><input required value={event.title} onChange={e=>setEvent({...event,title:e.target.value})} placeholder="Arrivée des invités"/></Field></div><button className="btn btn-dark full" disabled={busy}>Enregistrer <Check size={17}/></button></form></Modal>}{modal==='editWedding'&&<Modal title="Modifier le mariage" onClose={()=>setModal(null)}><form className="modal-form" onSubmit={saveWedding}><Field label="Vos prénoms"><input required value={editWedding.partner_names} onChange={e=>setEditWedding({...editWedding,partner_names:e.target.value})}/></Field><div className="form-row"><Field label="Date"><input type="date" required value={editWedding.date} onChange={e=>setEditWedding({...editWedding,date:e.target.value})}/></Field><Field label="Lieu"><input required value={editWedding.venue} onChange={e=>setEditWedding({...editWedding,venue:e.target.value})}/></Field></div><p className="field-note">Changer la date du mariage ne modifie pas les PACTEs signés. Informez vos prestataires via une demande de report.</p><button className="btn btn-dark full" disabled={busy}>Enregistrer <Check size={17}/></button></form></Modal>}<Toast message={error} onClose={()=>setError('')}/></main></Shell>}
function ProviderPage({user}:{user:User}){const [pacts,setPacts]=useState<Pact[]>([]),[timeline,setTimeline]=useState<{pacts:Pact[];weddings:Wedding[]}>({pacts:[],weddings:[]}),[requests,setRequests]=useState<PactRequest[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[modal,setModal]=useState(false);async function load(){try{const [p,t,r]=await Promise.all([api<Pact[]>('pacts'),api<{pacts:Pact[];weddings:Wedding[]}>('timeline'),api<PactRequest[]>('requests')]);setPacts(p.filter(x=>x.provider_email===user.email?.toLowerCase()));setTimeline(t);setRequests(r)}catch(e:any){setError(e.message)}finally{setLoading(false)}}useEffect(()=>{load()},[user.id]);const actions=pacts.filter(p=>!p.provider_signed_at&&['proposed','awaiting_provider'].includes(p.status));const requestActions=requests.filter(r=>r.status==='pending'&&r.requested_by!==user.id&&pacts.some(p=>p.id===r.pact_id));return <Shell user={user} onSignOut={()=>supabase.auth.signOut()}><main className="workspace"><div className="page-heading"><div><span className="eyebrow">Espace prestataire</span><h1>Vos engagements<span className="accent-dot">.</span></h1><p>Des prestations claires, un planning fiable.</p></div><button className="btn btn-dark" onClick={()=>setModal(true)}><Plus size={18}/> Proposer un PACTE</button></div>{loading?<Loading/>:<>{(actions.length+requestActions.length)>0&&<div className="action-banner"><div className="banner-icon"><Bell size={19}/></div><div><strong>{actions.length+requestActions.length} action{actions.length+requestActions.length>1?'s':''} à effectuer</strong><p>{actions.length?'Un PACTE attend votre signature.':'Une demande attend votre réponse.'}</p></div><Link className="btn btn-small btn-white" to={'/pacte/'+(actions[0]?.id||requestActions[0]?.pact_id)}>Répondre <ArrowRight size={15}/></Link></div>}<div className="provider-grid"><section className="panel"><div className="panel-head"><div><span className="section-kicker">Votre agenda</span><h2>Timeline prestataire</h2><p>Uniquement vos prestations signées.</p></div></div>{timeline.pacts.length?<div className="provider-events">{[...timeline.pacts].sort((a,b)=>{const da=timeline.weddings.find(w=>w.id===a.wedding_id)?.date||'';const db=timeline.weddings.find(w=>w.id===b.wedding_id)?.date||'';return (da+a.start_time).localeCompare(db+b.start_time)}).map(p=>{const w=timeline.weddings.find(w=>w.id===p.wedding_id);return <Link to={'/pacte/'+p.id} className="provider-event" key={p.id}><div className="provider-date"><strong>{w?.date?.split('-')[2]||'—'}</strong><span>{w?new Date(w.date+'T12:00:00').toLocaleDateString('fr-FR',{month:'short'}):'—'}</span></div><div><strong>{p.service_title}</strong><p>{w?.partner_names||'Mariage'} · {p.start_time} – {p.end_time}</p></div><ChevronRight size={17}/></Link>})}</div>:<div className="empty small"><CalendarDays size={25}/><h3>Votre agenda est libre.</h3><p>Une prestation s’affichera ici après les deux signatures.</p></div>}</section><section className="panel"><div className="panel-head"><div><span className="section-kicker">Accords</span><h2>Vos PACTEs</h2><p>Retrouvez chaque proposition et son état.</p></div></div>{pacts.length?<div className="pact-list">{pacts.map(p=><Link className="pact-list-row" key={p.id} to={'/pacte/'+p.id}><span className="list-file"><FileText size={19}/></span><span className="list-info"><strong>{p.service_title}</strong><small>{p.start_time} – {p.end_time}</small></span><span className={'status status-'+p.status}>{labels[p.status]||p.status}</span><ChevronRight size={17} className="row-chevron"/></Link>)}</div>:<div className="empty small"><FileText size={25}/><h3>Aucun PACTE pour l’instant.</h3><p>Vous pouvez proposer votre propre accord à un couple.</p><button className="btn btn-dark" onClick={()=>setModal(true)}>Proposer un PACTE <ArrowRight size={16}/></button></div>}</section></div></>}{modal&&<Modal title="Proposer un PACTE" onClose={()=>setModal(false)}><PactForm onClose={()=>setModal(false)} onDone={()=>{setModal(false);load()}}/></Modal>}<Toast message={error} onClose={()=>setError('')}/></main></Shell>}
function PactPage({user}:{user:User}){const {id}=useParams();const [pact,setPact]=useState<Pact|null>(null),[wedding,setWedding]=useState<Wedding|null>(null),[requests,setRequests]=useState<PactRequest[]>([]),[payments,setPayments]=useState<Payment[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[requestType,setRequestType]=useState<'cancellation'|'reschedule'|'change'|null>(null),[reason,setReason]=useState(''),[proposedDate,setProposedDate]=useState(''),[paymentModal,setPaymentModal]=useState(false),[payForm,setPayForm]=useState({label:'',amount:'',due_date:''}),[revision,setRevision]=useState(false),[copied,setCopied]=useState(false);const isClient=pact?.client_user_id===user.id;async function load(){try{const [ps,rs,pys,w]=await Promise.all([api<Pact[]>('pacts'),api<PactRequest[]>('requests'),api<Payment[]>('payments'),api<Wedding>('wedding-info?pact_id='+id)]);const p=ps.find(x=>x.id===id);if(!p)throw new Error('PACTE introuvable ou accès refusé.');setPact(p);setRequests(rs.filter(r=>r.pact_id===id));setPayments(pys.filter(x=>x.pact_id===id));setWedding(w)}catch(e:any){setError(e.message)}finally{setLoading(false)}}useEffect(()=>{load()},[id]);async function sign(){if(!confirm('Confirmer votre signature de ce PACTE ? Les détails seront figés après les deux signatures.'))return;setBusy(true);try{await api('pacts','PUT',{id,action:'sign'});await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}}async function rejectPact(){if(!confirm('Refuser cette proposition ? Elle ne pourra plus être signée et restera dans l’historique.'))return;setBusy(true);try{await api('pacts','PUT',{id,action:'reject'});await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}}async function sendRequest(e:React.FormEvent){e.preventDefault();setBusy(true);try{await api('requests','POST',{pact_id:id,type:requestType,reason,proposed_date:requestType==='reschedule'?proposedDate:null});setRequestType(null);setReason('');await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}}async function decide(r:PactRequest,decision:'approve'|'reject'){if(decision==='approve'&&r.type==='cancellation'&&!confirm('Accepter l’annulation ? La prestation quittera les deux Timelines.'))return;setBusy(true);try{await api('requests','PUT',{id:r.id,decision});await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}}async function addPayment(e:React.FormEvent){e.preventDefault();setBusy(true);try{await api('payments','POST',{pact_id:id,label:payForm.label,amount:Number(payForm.amount),due_date:payForm.due_date||null});setPaymentModal(false);setPayForm({label:'',amount:'',due_date:''});await load()}catch(e:any){setError(e.message)}finally{setBusy(false)}}async function payAction(id:string,method:'PUT'|'DELETE',status?:string){try{await api('payments',method,{id,status});await load()}catch(e:any){setError(e.message)}}function share(){navigator.clipboard.writeText(location.origin+'/pacte/'+id).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2400)}).catch(()=>setError('Impossible de copier le lien.'))}const isPendingPact=pact&&['proposed','awaiting_client','awaiting_provider'].includes(pact.status);const canSign=isPendingPact&&!(isClient?pact.client_signed_at:pact.provider_signed_at);const pending=requests.find(r=>r.status==='pending');return <Shell user={user} onSignOut={()=>supabase.auth.signOut()}><main className="workspace pact-workspace">{loading?<Loading/>:pact?<><Link to={isClient?'/mariage/'+pact.wedding_id:'/prestataire'} className="back-link"><ArrowLeft size={16}/> {isClient?'Retour au mariage':'Mes prestations'}</Link><div className="pact-title-area"><div><span className="eyebrow">PACTE · {pact.id.slice(0,8).toUpperCase()}</span><h1>{pact.service_title}<span className="accent-dot">.</span></h1><p>Accord entre le couple et son prestataire.</p></div><span className={'status status-large status-'+pact.status}>{pact.status==='signed'&&<Check size={15}/>} {labels[pact.status]||pact.status}</span></div>{isPendingPact&&<div className="decision-panel"><div className="decision-copy"><span className="section-kicker">À vous de décider</span><h2>{canSign?'Confirmer cet accord ?':'En attente de l’autre signature'}</h2><p>Vérifiez les informations avant de signer. Modifier crée une nouvelle proposition ; refuser clôt celle-ci. Rien n’apparaît dans les Timelines avant les deux signatures.</p></div><div className="decision-actions">{canSign&&<button className="btn btn-dark" onClick={sign} disabled={busy}><Check size={16}/> Confirmer et signer</button>}<button className="btn btn-outline" onClick={()=>setRevision(true)} disabled={busy}><PenLine size={16}/> Proposer une modification</button><button className="btn btn-text-danger" onClick={rejectPact} disabled={busy}>Refuser le PACTE</button></div></div>}{pact.status==='signed'&&<div className="signed-strip"><ShieldCheck size={19}/><span>Signé par les deux parties. Cette prestation figure dans les deux Timelines.</span></div>}<div className="pact-layout"><div className="pact-main"><div className="document-card"><div className="document-top"><div className="document-brand"><span className="brand-mark"><span/></span> PACTE<span className="brand-period">.</span></div><span>Accord de prestation</span></div><div className="document-section"><span className="section-kicker">Les parties</span><div className="document-cols"><div><small>Le couple</small><strong>{wedding?.partner_names||'Le couple'}</strong><span>{wedding?fmt(wedding.date):'Mariage associé'}</span></div><div><small>Le prestataire</small><strong>{pact.provider_name}</strong><span>{pact.trade||'Prestataire'} · {pact.provider_email}</span></div></div></div><div className="document-section"><span className="section-kicker">La prestation</span><h2>{pact.service_title}</h2><p className="doc-description">{pact.description||'Aucune précision supplémentaire.'}</p><div className="document-facts"><div><Clock3 size={17}/><span><small>Horaires</small><strong>{pact.start_time} – {pact.end_time}</strong></span></div><div><CalendarDays size={17}/><span><small>Date du mariage</small><strong>{wedding?fmt(wedding.date):'Voir avec le couple'}</strong></span></div><div><MapPin size={17}/><span><small>Lieu</small><strong>{wedding?.venue||'Voir avec le couple'}</strong></span></div></div></div><div className="document-section"><span className="section-kicker">Conditions financières</span><div className="amount-line"><span>Montant convenu</span><strong>{euro(pact.amount)}</strong></div><div className="amount-line secondary"><span>Acompte prévu</span><strong>{euro(pact.deposit)}</strong></div></div><div className="document-section signatures"><span className="section-kicker">Signatures</span><div className="signature-grid"><div className={pact.client_signed_at?'signed-box':'unsigned-box'}><span>{pact.client_signed_at?<CheckCircle2 size={20}/>:<Clock3 size={20}/>}</span><small>Le couple</small><strong>{pact.client_signed_at?'Signé':'Signature attendue'}</strong>{pact.client_signed_at&&<em>{new Date(pact.client_signed_at).toLocaleString('fr-FR')}</em>}</div><div className={pact.provider_signed_at?'signed-box':'unsigned-box'}><span>{pact.provider_signed_at?<CheckCircle2 size={20}/>:<Clock3 size={20}/>}</span><small>Le prestataire</small><strong>{pact.provider_signed_at?'Signé':'Signature attendue'}</strong>{pact.provider_signed_at&&<em>{new Date(pact.provider_signed_at).toLocaleString('fr-FR')}</em>}</div></div></div><div className="document-end"><LockKeyhole size={15}/> Document de suivi des engagements · PACTE ne garantit pas d’issue juridique.</div></div></div><aside className="pact-aside"><div className="side-card"><span className="section-kicker">Partager</span><h3>Un accord, deux regards.</h3><p>Partagez ce lien avec l’autre partie. L’accès au document nécessite une connexion avec l’e-mail indiqué.</p><button className="btn btn-outline full" onClick={share}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Lien copié':'Copier le lien du PACTE'}</button>{!isClient&&<p className="field-note">Code du mariage à demander au couple pour créer votre propre offre : {pact.wedding_id}</p>}</div>{pact.status==='signed'&&<><div className="side-card"><span className="section-kicker">Évolution</span><h3>Un changement ?</h3><p>Un PACTE signé reste intact. Proposez un nouvel accord ou demandez une décision à l’autre partie.</p>{pending?<div className="pending-note"><Clock3 size={16}/> Une demande est en attente.</div>:<div className="side-actions"><button onClick={()=>setRequestType('change')}>Demander une modification <ChevronRight size={16}/></button><button onClick={()=>setRequestType('reschedule')}>Demander un report <ChevronRight size={16}/></button><button onClick={()=>setRequestType('cancellation')}>Demander une annulation <ChevronRight size={16}/></button></div>}</div><div className="side-card"><span className="section-kicker">Paiements</span><h3>Jalons de paiement</h3><p>Un suivi simple, lié à ce PACTE. Aucun paiement n’est traité par PACTE.</p><div className="payment-list">{payments.map(x=><div className="payment-row" key={x.id}><div><strong>{x.label} · {euro(x.amount)}</strong><small>{x.due_date?fmt(x.due_date):'Sans échéance'} · {x.status==='paid'?'Réglé':'À régler'}</small></div><div><button title={x.status==='paid'?'Marquer à régler':'Marquer réglé'} onClick={()=>payAction(x.id,'PUT',x.status==='paid'?'pending':'paid')}><Check size={15}/></button><button title="Supprimer" onClick={()=>{if(confirm('Supprimer ce jalon ?'))payAction(x.id,'DELETE')}}><Trash2 size={15}/></button></div></div>)}</div><button className="btn btn-outline full" onClick={()=>setPaymentModal(true)}><Plus size={16}/> Ajouter un jalon</button></div></>}{requests.length>0&&<div className="side-card"><span className="section-kicker">Historique</span><h3>Demandes</h3>{requests.map(r=><div className="request-row" key={r.id}><div className="request-top"><strong>{requestLabels[r.type]}</strong><span className={'status status-'+r.status}>{r.status==='pending'?'En attente':r.status==='approved'?'Acceptée':'Refusée'}</span></div><p>{r.reason}</p>{r.proposed_date&&<small>Nouvelle date proposée : {fmt(r.proposed_date)}</small>}{r.status==='pending'&&r.requested_by!==user.id&&<div className="request-buttons"><button className="btn btn-dark btn-small" disabled={busy} onClick={()=>decide(r,'approve')}>Accepter</button><button className="btn btn-outline btn-small" disabled={busy} onClick={()=>decide(r,'reject')}>Refuser</button></div>}{r.status==='approved'&&r.type!=='cancellation'&&<p className="field-note">Accord de principe uniquement : créez un nouveau PACTE pour acter les nouvelles conditions. L’ancien reste signé jusqu’à son remplacement.</p>}</div>)}</div>}{pact.status==='signed'&&<button className="btn btn-soft full" onClick={()=>setRevision(true)}><Plus size={17}/> Proposer une nouvelle version</button>}</aside></div></>:null}{requestType&&<Modal title={'Demander une '+(requestLabels[requestType]||'modification').toLowerCase()} onClose={()=>setRequestType(null)}><form className="modal-form" onSubmit={sendRequest}><p className="form-intro">Cette demande ne modifie pas le PACTE signé. L’autre partie doit répondre.</p><Field label="Motif de la demande"><textarea required rows={4} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Expliquez clairement votre demande…"/></Field>{requestType==='reschedule'&&<Field label="Nouvelle date proposée"><input required type="date" value={proposedDate} onChange={e=>setProposedDate(e.target.value)}/></Field>}<button className="btn btn-dark full" disabled={busy}>Envoyer la demande <ArrowRight size={16}/></button></form></Modal>}{paymentModal&&<Modal title="Ajouter un jalon" onClose={()=>setPaymentModal(false)}><form className="modal-form" onSubmit={addPayment}><Field label="Intitulé"><input required value={payForm.label} onChange={e=>setPayForm({...payForm,label:e.target.value})} placeholder="Acompte à la réservation"/></Field><div className="form-row"><Field label="Montant (€)"><input type="number" min="0.01" step="0.01" required value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})}/></Field><Field label="Échéance (facultatif)"><input type="date" value={payForm.due_date} onChange={e=>setPayForm({...payForm,due_date:e.target.value})}/></Field></div><button className="btn btn-dark full" disabled={busy}>Ajouter <Plus size={16}/></button></form></Modal>}{revision&&pact&&<Modal title={pact.status==='signed'?'Nouvelle version du PACTE':'Proposer une modification'} onClose={()=>setRevision(false)}><PactForm wedding={isClient?{id:pact.wedding_id,partner_names:wedding?.partner_names||'',date:wedding?.date||'',venue:wedding?.venue||''}:undefined} replaces={{...pact,provider_email:isClient?pact.provider_email:user.email||pact.provider_email}} onClose={()=>setRevision(false)} onDone={()=>{setRevision(false);load();setError('Nouvelle proposition créée. Retrouvez-la dans votre liste de PACTEs.')}}/></Modal>}<Toast message={error} onClose={()=>setError('')}/></main></Shell>}
function App(){const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);useEffect(()=>{supabase.auth.getSession().then(({data})=>{setUser(data.session?.user||null);setLoading(false)});const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setUser(session?.user||null);setLoading(false)});return()=>subscription.unsubscribe()},[]);if(loading)return <Loading/>;const guard=(element:React.ReactNode)=>(user?element:<Navigate to={'/connexion?role=provider&next='+encodeURIComponent(window.location.pathname)} replace/>);return <BrowserRouter><Routes><Route path="/" element={<Home user={user}/>}/><Route path="/connexion" element={<Auth user={user}/>}/><Route path="/espace" element={guard(<Dashboard user={user!}/>)}/><Route path="/mariage/:id" element={guard(<WeddingPage user={user!}/>)}/><Route path="/prestataire" element={guard(<ProviderPage user={user!}/>)}/><Route path="/pacte/:id" element={guard(<PactPage user={user!}/>)}/><Route path="*" element={<Home user={user}/>}/></Routes></BrowserRouter>}
export default App;
