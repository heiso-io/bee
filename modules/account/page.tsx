import { redirect } from "next/navigation";

export default function Profile() {
  redirect("/portal/core/account/me");
}
