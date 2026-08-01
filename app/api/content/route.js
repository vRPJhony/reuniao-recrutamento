import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { defaultContent } from "@/lib/defaultContent";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const current = await db.collection("site_content").findOne({ key: "main" });

    if (!current) {
      await db.collection("site_content").insertOne({
        key: "main",
        data: defaultContent,
        updatedAt: new Date()
      });

      return NextResponse.json(defaultContent);
    }

    return NextResponse.json(current.data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível carregar o conteúdo." },
      { status: 500 }
    );
  }
}
