import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb";
import { isAdmin } from "../../../lib/auth";
export const dynamic = "force-dynamic";
const clean = (v,max=300) => typeof v === "string" ? v.trim().slice(0,max) : "";
export async function POST(req){
 try {
  const body=await req.json();
  const data={nome:clean(body.nome,120),discord:clean(body.discord,120),area:clean(body.area,100),disponibilidade:clean(body.disponibilidade,200),experiencia:clean(body.experiencia,1500),motivacao:clean(body.motivacao,1500)};
  if(!data.nome||!data.discord||!data.area||!data.motivacao||!body.consentimento) return NextResponse.json({error:"Preencha os campos obrigatórios e aceite o aviso de privacidade."},{status:400});
  if(JSON.stringify(body).length>12000) return NextResponse.json({error:"Dados muito extensos."},{status:413});
  const db=await getDb(); await db.collection("candidaturas").insertOne({...data,status:"recebida",createdAt:new Date()});
  return NextResponse.json({ok:true},{status:201});
 }catch(e){console.error(e);return NextResponse.json({error:"Não foi possível registrar a candidatura."},{status:500});}
}
export async function GET(){
 if(!await isAdmin())return NextResponse.json({error:"Não autorizado"},{status:401});
 const db=await getDb();const items=await db.collection("candidaturas").find({}).sort({createdAt:-1}).limit(500).toArray();return NextResponse.json(items);
}
export async function PATCH(req){
 if(!await isAdmin())return NextResponse.json({error:"Não autorizado"},{status:401});
 const {id,status}=await req.json();const allowed=["recebida","em_analise","entrevista","aprovada","reprovada"];
 if(!allowed.includes(status)||!(/^[a-f0-9]{24}$/i.test(id||"")))return NextResponse.json({error:"Dados inválidos"},{status:400});
 const {ObjectId}=await import("mongodb");const db=await getDb();await db.collection("candidaturas").updateOne({_id:new ObjectId(id)},{$set:{status,updatedAt:new Date()}});return NextResponse.json({ok:true});
}
