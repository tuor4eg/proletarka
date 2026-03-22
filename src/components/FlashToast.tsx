"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

function FlashToastInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const flash = searchParams.get("flash");

  useEffect(() => {
    if (!flash) return;
    try {
      const { message, type } = JSON.parse(decodeURIComponent(flash));
      if (type === "error") toast.error(message, { id: "flash" });
      else toast.success(message, { id: "flash" });
    } catch {
      toast.success(flash, { id: "flash" });
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("flash");
    const newUrl = params.size > 0 ? `${pathname}?${params}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [flash, pathname, router, searchParams]);

  return null;
}

export function FlashToast() {
  return (
    <Suspense>
      <FlashToastInner />
    </Suspense>
  );
}
