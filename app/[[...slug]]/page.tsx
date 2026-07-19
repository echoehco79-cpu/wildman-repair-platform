import AppShell from "@/components/app-shell";
import { redirect } from "next/navigation";

export default function Page() {
  if (process.env.VERCEL) {
    redirect("/showcase");
  }

  return <AppShell />;
}
