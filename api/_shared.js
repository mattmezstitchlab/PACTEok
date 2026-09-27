import supabase from './db-client.js';
export const cors = (req,res) => { res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS'); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); if(req.method==='OPTIONS'){res.status(204).end();return true} return false; };
export async function identity(req,res){ const token=req.headers.authorization?.replace('Bearer ',''); if(!token){res.status(401).json({error:'Connectez-vous pour continuer.'});return null} const {data:{user},error}=await supabase.auth.getUser(token); if(error||!user){res.status(401).json({error:'Session expirée. Reconnectez-vous.'});return null} return user; }
export const fail=(res,e)=>{console.error('API error:',e);res.status(500).json({error:e.message||'Une erreur est survenue.'})};
export const bad=(res,msg)=>res.status(400).json({error:msg});
export const emailOf=user=>user.email?.toLowerCase()||'';
