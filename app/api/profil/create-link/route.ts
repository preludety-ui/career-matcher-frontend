
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
 
function makeToken(size = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: size }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
 
export async function POST(req: NextRequest) {
  const { candidatId, employeur } = await req.json()
 
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
 
  const token = makeToken()
 
  const { data, error } = await supabase
    .from("profil_links")
    .insert({ token, candidat_id: candidatId, employeur: employeur || null, views: 0, active: true })
    .select()
    .single()
 
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
 
  return NextResponse.json({
    link: {
      id: data.id,
      url: `${process.env.NEXT_PUBLIC_URL}/p/${token}`,
      createdAt: new Date().toISOString().split("T")[0],
      views: 0,
      active: true,
      employeur: employeur || null,
    }
  })
}

 