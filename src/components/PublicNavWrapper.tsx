import { getSession } from "@/lib/session";
import { PublicNav } from "./PublicNav";

export async function PublicNavWrapper() {
  const session = await getSession();
  return <PublicNav isAdmin={!!session} />;
}
