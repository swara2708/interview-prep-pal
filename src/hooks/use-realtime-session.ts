import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

export function useRealtimeSession(sessionId: string | undefined, onChange: () => void) {
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "answers" },
        () => {
          // RLS ensures we only receive answer rows the user owns, so any
          // change here is relevant to one of their sessions.
          onChange();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        onChange,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, onChange]);
}

export function useRealtimeSessions(onChange: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel("sessions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        onChange,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onChange]);
}
