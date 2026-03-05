import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "../config/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

// ── ICE servers (STUN for NAT traversal, free TURN fallback) ─────
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export type CallState =
  | "idle"
  | "calling"
  | "incoming"
  | "connecting"
  | "connected"
  | "ended"
  | "error";

interface UseWebRTCOptions {
  consultationId: string;
  role: "doctor" | "patient";
  onIncomingCall?: (callerName: string) => void;
  onCallEnded?: () => void;
}

export function useWebRTC({
  consultationId,
  role,
  onIncomingCall,
  onCallEnded,
}: UseWebRTCOptions) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Exposed refs for video elements
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const channelName = `call:${consultationId}`;

  // ── Create peer connection ───────────────────────────────────────
  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: candidate.toJSON() },
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallState("connected");
      }
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setCallState("ended");
        onCallEnded?.();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [onCallEnded]);

  // ── Get local camera/mic ─────────────────────────────────────────
  const getLocalMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }, []);

  // ── Subscribe to signaling channel ──────────────────────────────
  useEffect(() => {
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "call-request" }, ({ payload }) => {
        if (role === "patient") {
          setCallState("incoming");
          onIncomingCall?.(payload.callerName ?? "Your doctor");
        }
      })
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (role === "patient") {
          setCallState("connecting");
          const pc = createPC();
          const stream = await getLocalMedia();
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({
            type: "broadcast",
            event: "answer",
            payload: { sdp: answer },
          });
        }
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (role === "doctor" && pcRef.current) {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(payload.sdp),
          );
        }
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        if (pcRef.current && payload.candidate) {
          try {
            await pcRef.current.addIceCandidate(
              new RTCIceCandidate(payload.candidate),
            );
          } catch (_) {}
        }
      })
      .on("broadcast", { event: "call-ended" }, () => {
        setCallState("ended");
        onCallEnded?.();
        cleanup(false);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [channelName, role, createPC, getLocalMedia, onIncomingCall, onCallEnded]);

  // ── Doctor: initiate call ────────────────────────────────────────
  const startCall = useCallback(
    async (callerName = "Dr. ") => {
      try {
        setError(null);
        setCallState("calling");

        // Announce call to patient
        channelRef.current?.send({
          type: "broadcast",
          event: "call-request",
          payload: { callerName },
        });

        const pc = createPC();
        const stream = await getLocalMedia();
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Small delay so patient has time to accept
        await new Promise((r) => setTimeout(r, 1500));

        channelRef.current?.send({
          type: "broadcast",
          event: "offer",
          payload: { sdp: offer },
        });
      } catch (err) {
        setError(
          "Could not access camera/microphone. Please allow permissions.",
        );
        setCallState("error");
      }
    },
    [createPC, getLocalMedia],
  );

  // ── Patient: accept call ─────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    setCallState("connecting");
  }, []);

  // ── End call ─────────────────────────────────────────────────────
  const cleanup = useCallback((sendSignal = true) => {
    if (sendSignal) {
      channelRef.current?.send({
        type: "broadcast",
        event: "call-ended",
        payload: {},
      });
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    localStreamRef.current = null;
    pcRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  const endCall = useCallback(() => {
    cleanup(true);
    setCallState("ended");
    onCallEnded?.();
  }, [cleanup, onCallEnded]);

  return {
    callState,
    error,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    endCall,
  };
}
