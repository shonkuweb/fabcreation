import { redirect } from "next/navigation";

export default function ProductPage({
  searchParams,
}: {
  searchParams?: { id?: string };
}) {
  const id = searchParams?.id;
  redirect(id ? `/home?tab=product&id=${encodeURIComponent(id)}` : "/home?tab=product");
}
