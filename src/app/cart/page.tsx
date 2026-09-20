import { redirect } from "next/navigation";

export default function CartPage() {
  redirect("/home?tab=cart");
}
