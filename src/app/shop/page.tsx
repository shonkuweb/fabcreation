import { redirect } from "next/navigation";

export default function ShopPage({
  searchParams,
}: {
  searchParams?: { cat?: string };
}) {
  const cat = searchParams?.cat;
  redirect(cat ? `/home?tab=shop&cat=${encodeURIComponent(cat)}` : "/home?tab=shop");
}
