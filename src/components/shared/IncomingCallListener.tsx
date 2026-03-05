import { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { VideoCallRoom } from "./VideoCallRoom";

export function IncomingCallListener() {
  const [incomingCall, setIncomingCall] = useState<{
    consultationId: string;
    callerName: string;
  } | null>(null);

  const [acceptedCall, setAcceptedCall] = useState<{
    consultationId: string;
    callerName: string;
  } | null>(null);

  useEffect(() => {
    let channels: RealtimeChannel[] = [];
    let isSubscribed = true;

    const setupListeners = async () => {
      // 1. Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !isSubscribed) return;

      // 2. Find all pending/scheduled consultations for this patient
      const { data: consultations } = await supabase
        .from("consultations")
        .select("id")
        .eq("patient_id", user.id)
        .in("status", ["pending", "scheduled"]);

      if (!consultations || !isSubscribed) return;

      // 3. Subscribe to the broadcast channel for each active consultation
      consultations.forEach((c) => {
        const channelName = `call:${c.id}`;
        const channel = supabase.channel(channelName);

        channel
          .on("broadcast", { event: "call-request" }, ({ payload }) => {
            setIncomingCall({
              consultationId: c.id,
              callerName: payload.callerName ?? "Your doctor",
            });
            // Play a ringtone if we wanted
          })
          .on("broadcast", { event: "call-ended" }, () => {
            setIncomingCall(null);
            setAcceptedCall(null);
          })
          .subscribe();

        channels.push(channel);
      });
    };

    setupListeners();

    return () => {
      isSubscribed = false;
      channels.forEach((ch) => ch.unsubscribe());
    };
  }, []);

  if (acceptedCall) {
    return (
      <VideoCallRoom
        consultationId={acceptedCall.consultationId}
        role="patient"
        otherPartyName={acceptedCall.callerName}
        onClose={() => setAcceptedCall(null)}
        autoStart={false}
      />
    );
  }

  // Incoming call banner overlay
  if (incomingCall) {
    return (
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-slate-900/60 backdrop-blur-sm px-4 fade-in">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border text-center animate-in slide-in-from-top-8 duration-300">
          <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-4 animate-pulse">
            {incomingCall.callerName.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {incomingCall.callerName}
          </h2>
          <p className="text-slate-500 mt-1 mb-8">is calling you (Video)</p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setIncomingCall(null)}
              className="bg-red-100 hover:bg-red-200 text-red-700 font-medium px-6 py-3 rounded-xl transition-colors w-full"
            >
              Decline
            </button>
            <button
              onClick={() => {
                setAcceptedCall(incomingCall);
                setIncomingCall(null);
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-xl transition-colors w-full shadow-lg shadow-green-600/20"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
