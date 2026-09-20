import { NextResponse } from "next/server";
import { deleteCategory } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = deleteCategory(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to delete category" },
      { status: 500 }
    );
  }
}
