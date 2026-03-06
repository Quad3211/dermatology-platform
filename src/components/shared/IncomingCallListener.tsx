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
  doctorName,
}: {
  consultationId: string;
  doctorName: string;
}) {
  const [showIncoming, setShowIncoming] = useState(false);
  const [showRoom, setShowRoom] = useState(false);
  const [callerName, setCallerName] = useState(doctorName);

  const handleIncomingCall = useCallback(
    (name: string) => {
      setCallerName(name || doctorName);
      setShowIncoming(true);
    },
    [doctorName],
  );

  const handleCallEnded = useCallback(() => {
    setShowIncoming(false);
    setShowRoom(false);
  }, []);

  // Mount the WebRTC hook immediately so it is subscribed to the
  // signaling channel before the doctor sends the offer.
  const { callState, acceptCall, endCall } = useWebRTC({
    consultationId,
    role: "patient",
    onIncomingCall: handleIncomingCall,
    onCallEnded: handleCallEnded,
  });

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
        role="patient"
        otherPartyName={callerName}
        onClose={() => {
          setShowRoom(false);
          endCall();
        }}
        autoStart={false}
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

// ── Root listener — mounts one listener per active consultation ─
export function IncomingCallListener() {
  const [consultations, setConsultations] = useState<
    { id: string; doctorName: string }[]
  >([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const { data } = await supabase
        .from("consultations")
        .select(`id, doctor:profiles!consultations_doctor_id_fkey(full_name)`)
        .eq("patient_id", user.id)
        .in("status", ["pending", "scheduled", "reviewed"]);

      if (!mounted || !data) return;

      setConsultations(
        (data as any[]).map((c) => ({
          id: c.id,
          doctorName: c.doctor?.full_name
            ? `Dr. ${(c.doctor.full_name as string).replace(/^Dr\.\s*/i, "")}`
            : "Your Doctor",
        })),
      );
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Render one listener per consultation — each mounts its own useWebRTC
  // so the signaling channel is live before any call arrives.
  return (
    <>
      {consultations.map((c) => (
        <ConsultationCallListener
          key={c.id}
          consultationId={c.id}
          doctorName={c.doctorName}
        />
      ))}
    </>
  );
}
