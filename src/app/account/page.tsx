import { redirect } from "next/navigation";

export default function AccountPage() {
  redirect("/home?tab=account");
}
