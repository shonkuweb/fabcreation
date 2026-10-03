import { NextResponse } from "next/server";
import { deleteCategory, updateCategory } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin session required to update categories." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const updated = updateCategory(params.id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, category: updated });
  } catch (err) {
    console.error("PATCH /api/categories/[id] error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin session required to delete categories." },
        { status: 401 }
      );
    }

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
