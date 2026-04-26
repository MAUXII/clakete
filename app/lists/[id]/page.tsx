"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "@/lib/supabase/database.types";

export default function LegacyListIdRedirect() {
  const params = useParams();
  const router = useRouter();
  const supabase = useSupabaseClient<Database>();
  const id = String(params.id || "");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!id) {
      setFailed(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data: listRow, error: listErr } = await supabase
        .from("lists")
        .select("slug, user_id")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;

      if (listErr || !listRow?.slug || !listRow.user_id) {
        setFailed(true);
        router.replace("/lists");
        return;
      }

      const { data: userRow } = await supabase
        .from("users")
        .select("username")
        .eq("id", listRow.user_id)
        .maybeSingle();

      if (cancelled) return;

      if (!userRow?.username) {
        setFailed(true);
        router.replace("/lists");
        return;
      }

      const u = userRow.username.toLowerCase();
      const path = `/${u}/list/${encodeURIComponent(listRow.slug)}`;
      router.replace(path);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, router, supabase]);

  if (failed) {
    return null;
  }

  return (
    <div className="py-12 text-center text-sm text-muted-foreground">Redirecionando…</div>
  );
}
