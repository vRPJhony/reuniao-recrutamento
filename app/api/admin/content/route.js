import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = await getDb();
  const current = await db.collection("site_content").findOne({ key: "main" });

  return NextResponse.json(current?.data || null);
}

export async function PUT(request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const data = await request.json();

    if (!data?.hero || !Array.isArray(data?.sections) || !Array.isArray(data?.alerts)) {
      return NextResponse.json({ error: "Estrutura inválida." }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("site_content").updateOne(
      { key: "main" },
      {
        $set: {
          data,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível salvar o conteúdo." },
      { status: 500 }
    );
  }
}
