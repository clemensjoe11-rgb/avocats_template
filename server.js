// Admin & Booking API for MEYNIOGLU LAW
// npm i && npm start, then open http://localhost:3000/admin
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'db.json');

const ADMIN_USER = process.env.ADMIN_USER || 'Admin_Meyniglu';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Meygnolu!!123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret';

// ---- helpers ----
function load(){ try{ return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); }catch{ return []; } }
function save(x){ fs.writeFileSync(DATA_FILE, JSON.stringify(x,null,2)); }
function safeEq(a,b){ a=String(a); b=String(b); if(a.length!==b.length) return false; return crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b)); }
function uuid(){ return crypto.randomUUID(); }

// ---- middleware ----
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'256kb'}));
app.use(session({
  name:'sid',
  secret: SESSION_SECRET,
  resave:false,
  saveUninitialized:false,
  cookie:{ httpOnly:true, sameSite:'lax', secure:false, maxAge:1000*60*60*8 }
}));

// static
app.use('/admin', express.static(path.join(__dirname,'public','admin')));
app.use('/', express.static(path.join(__dirname,'public')));

// auth guards
function requireAdmin(req,res,next){ if(req.session && req.session.admin) return next(); res.status(401).json({ok:false,error:'Unauthorized'}); }
function requireCsrf(req,res,next){
  const t=req.headers['x-csrf-token']; if(!t || !req.session || t!==req.session.csrf) return res.status(403).json({ok:false,error:'Invalid CSRF'});
  next();
}

// ---- public booking API ----
app.get('/api/slots',(req,res)=>{
  const all = load();
  if(req.query.all==='1') return res.json({ok:true,data:all});
  res.json({ok:true,data:all.filter(x=>x.taken).map(x=>({startISO:x.startISO,endISO:x.endISO}))});
});

app.post('/api/book',(req,res)=>{
  const p=req.body||{};
  const need=['firstName','lastName','email','gender','phone','countryCode','birthDate','startISO','endISO'];
  for(const k of need){ if(!p[k]) return res.status(400).json({ok:false,error:'Missing '+k}); }
  const all=load();
  if(all.some(x=>x.startISO===p.startISO && x.taken)) return res.status(409).json({ok:false,error:'Slot already taken'});
  const row={ id:uuid(), ...p, taken:true, createdAt:new Date().toISOString() };
  all.push(row); save(all);
  res.json({ok:true,data:{id:row.id}});
});

// ---- admin auth ----
app.post('/api/admin/login',(req,res)=>{
  const {username,password}=req.body||{};
  if(safeEq(username||'',ADMIN_USER) && safeEq(password||'',ADMIN_PASS)){
    req.session.regenerate(err=>{
      if(err) return res.status(500).json({ok:false,error:'Session error'});
      req.session.admin={username}; req.session.csrf=crypto.randomBytes(24).toString('hex');
      res.json({ok:true,csrf:req.session.csrf});
    });
  }else res.status(401).json({ok:false,error:'Invalid credentials'});
});

app.get('/api/admin/me',requireAdmin,(req,res)=> res.json({ok:true,user:req.session.admin,csrf:req.session.csrf}));
app.post('/api/admin/logout',requireAdmin,requireCsrf,(req,res)=> req.session.destroy(()=>res.json({ok:true})));

// ---- admin data ----
app.get('/api/admin/slots',requireAdmin,(req,res)=>{
  const {q,from,to}=req.query||{};
  let arr=load();
  if(from){ const ts=new Date(from).getTime(); if(!isNaN(ts)) arr=arr.filter(r=>new Date(r.startISO).getTime()>=ts); }
  if(to){ const ts=new Date(to).getTime()+86400000-1; if(!isNaN(ts)) arr=arr.filter(r=>new Date(r.startISO).getTime()<=ts); }
  if(q){ const t=String(q).toLowerCase(); arr=arr.filter(r=>(`${r.firstName||''} ${r.lastName||''} ${r.email||''} ${r.phone||''}`).toLowerCase().includes(t)); }
  arr.sort((a,b)=>new Date(a.startISO)-new Date(b.startISO));
  res.json({ok:true,data:arr});
});

app.delete('/api/admin/slots/:id',requireAdmin,requireCsrf,(req,res)=>{
  const id=String(req.params.id); let arr=load(); const before=arr.length;
  arr=arr.filter(x=>String(x.id)!==id); if(arr.length===before) return res.status(404).json({ok:false,error:'Not found'});
  save(arr); res.json({ok:true});
});

app.post('/api/admin/deleteByStart',requireAdmin,requireCsrf,(req,res)=>{
  const {startISO}=req.body||{}; if(!startISO) return res.status(400).json({ok:false,error:'startISO required'});
  let arr=load(); const before=arr.length; arr=arr.filter(x=>x.startISO!==startISO);
  if(arr.length===before) return res.status(404).json({ok:false,error:'Not found'});
  save(arr); res.json({ok:true});
});

// SPA fallback
app.get('/admin/*',(req,res)=> res.sendFile(path.join(__dirname,'public','admin','index.html')));
app.use((req,res)=> res.status(404).json({ok:false,error:'Not found'}));

app.listen(PORT,()=>console.log('http://localhost:'+PORT));
