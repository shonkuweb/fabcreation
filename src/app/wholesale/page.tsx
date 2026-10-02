import { redirect } from "next/navigation";

export default function WholesalePage({
  searchParams,
}: {
  searchParams?: { login?: string; tab?: string };
}) {
  const isLogin = searchParams?.login === "true";
  const tab = searchParams?.tab || "shop";
  redirect(`/home?mode=wholesale&tab=${tab}${isLogin ? "&login=true" : ""}`);
}
