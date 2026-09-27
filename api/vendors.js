import supabase from './db-client.js';
import {cors,identity,fail,bad} from './_shared.js';
export default async function handler(req,res){if(cors(req,res))return;const user=await identity(req,res);if(!user)return;try{
 const wedding_id=req.method==='GET'?req.query.wedding_id:req.body?.wedding_id;
 const {data:wedding}=await supabase.from('weddings').select('id').eq('id',wedding_id||'00000000-0000-0000-0000-000000000000').eq('owner_id',user.id).maybeSingle();if(!wedding)return res.status(403).json({error:'Accès refusé.'});
 if(req.method==='GET'){const {data,error}=await supabase.from('vendors').select('*').eq('wedding_id',wedding_id).order('created_at',{ascending:false});if(error)throw error;return res.status(200).json(data)}
 if(req.method==='POST'){const {name,trade,email,desired_service}=req.body||{};if(!name?.trim()||!trade?.trim()||!email?.includes('@'))return bad(res,'Nom, métier et e-mail valide requis.');const {data,error}=await supabase.from('vendors').insert({wedding_id,name:name.trim(),trade:trade.trim(),email:email.trim().toLowerCase(),desired_service:desired_service?.trim()||''}).select('*').single();if(error)throw error;return res.status(201).json(data)}
 if(req.method==='DELETE'){const {id}=req.body||{};const {data:vendor}=await supabase.from('vendors').select('id').eq('id',id).eq('wedding_id',wedding_id).maybeSingle();if(!vendor)return bad(res,'Prestataire introuvable.');const {data:linked}=await supabase.from('pacts').select('id').eq('vendor_id',id).limit(1);if(linked?.length)return bad(res,'Ce prestataire possède un PACTE. Conservez sa fiche pour garder la traçabilité.');const {error}=await supabase.from('vendors').delete().eq('id',id);if(error)throw error;return res.status(200).json({ok:true})}
 return res.status(405).json({error:'Méthode non autorisée.'});
 }catch(e){fail(res,e)}}
