import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../config/supabase";
import { useWebRTC } from "../../hooks/useWebRTC";
import { VideoCallRoom } from "./VideoCallRoom";
import { Phone, PhoneOff } from "lucide-react";

// ── Per-consultation listener ──────────────────────────────────
// Each active consultation gets its own hook instance so the signaling
// channel is subscribed BEFORE the doctor ever sends an offer.
// This avoids the race condition where VideoCallRoom subscribes too late.
function ConsultationCallListener({
  consultationId,
  role,
  otherPartyName,
}: {
  consultationId: string;
  role: "doctor" | "patient";
  otherPartyName: string;
}) {
  const [showIncoming, setShowIncoming] = useState(false);
  const [showRoom, setShowRoom] = useState(false);
  const [callerName, setCallerName] = useState(otherPartyName);

  const handleIncomingCall = useCallback(
    (name: string) => {
      setCallerName(name || otherPartyName);
      setShowIncoming(true);
    },
    [otherPartyName],
  );

  const handleCallEnded = useCallback(() => {
    setShowIncoming(false);
    setShowRoom(false);
  }, []);

  const webRtcState = useWebRTC({
    consultationId,
    role, // pass dynamic role down
    onIncomingCall: handleIncomingCall,
    onCallEnded: handleCallEnded,
  });

  const { callState, acceptCall, endCall } = webRtcState;

  // Auto-dismiss incoming UI if doctor hung up
  useEffect(() => {
    if (callState === "ended" || callState === "idle") {
      setShowIncoming(false);
    }
  }, [callState]);

  const handleAccept = () => {
    setShowIncoming(false);
    setShowRoom(true);
    acceptCall();
  };

  const handleDecline = () => {
    setShowIncoming(false);
    endCall();
  };

  if (showRoom) {
    return (
      <VideoCallRoom
        consultationId={consultationId}
        role={role}
        otherPartyName={callerName}
        onClose={() => {
          setShowRoom(false);
          endCall();
        }}
        autoStart={false}
        webRtcState={webRtcState}
      />
    );
  }

  if (showIncoming) {
    return (
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 bg-slate-900/70 backdrop-blur-sm px-4 fade-in">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-slate-100 text-center">
          {/* Pulsing avatar */}
          <div className="relative mx-auto w-24 h-24 mb-5">
            <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-ping" />
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-green-500/30">
              {callerName.charAt(0).toUpperCase()}
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900">{callerName}</h2>
          <p className="text-slate-500 text-sm mt-1 mb-8">
            is calling you · Video consultation
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleDecline}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-6 py-3 rounded-xl transition-colors w-full justify-center border border-red-200"
            >
              <PhoneOff className="h-4 w-4" />
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors w-full justify-center shadow-lg shadow-green-600/25"
            >
              <Phone className="h-4 w-4" />
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function IncomingCallListener({
  role = "patient",
}: {
  role?: "doctor" | "patient";
}) {
  const [consultations, setConsultations] = useState<
    { id: string; otherPartyName: string }[]
  >([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const columnFilter = role === "patient" ? "patient_id" : "doctor_id";
      const selectQuery =
        role === "patient"
          ? `id, profiles:consultations_doctor_id_fkey(full_name)`
          : `id, profiles:consultations_patient_id_fkey(full_name)`;

      const { data } = await supabase
        .from("consultations")
        .select(selectQuery)
        .eq(columnFilter, user.id)
        .in("status", ["pending", "scheduled", "reviewed"]);

      if (!mounted || !data) return;

      setConsultations(
        (data as any[]).map((c) => ({
          id: c.id,
          otherPartyName: c.profiles?.full_name
            ? role === "patient"
              ? `Dr. ${(c.profiles.full_name as string).replace(/^Dr\.\s*/i, "")}`
              : (c.profiles.full_name as string)
            : role === "patient"
              ? "Your Doctor"
              : "Patient",
        })),
      );
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      {consultations.map((c) => (
        <ConsultationCallListener
          key={c.id}
          consultationId={c.id}
          role={role}
          otherPartyName={c.otherPartyName}
        />
      ))}
    </>
  );
}
