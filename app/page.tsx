import { redirect } from "next/navigation";

export default function RootPage() {
  // Unauthenticated users are sent to login
  redirect("/login");
}
