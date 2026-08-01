import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { defaultContent } from "@/lib/defaultContent";
import { isAdmin } from "@/lib/auth";

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = await getDb();
  await db.collection("site_content").updateOne(
    { key: "main" },
    {
      $set: {
        data: defaultContent,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  return NextResponse.json(defaultContent);
}
