import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "../config/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

// ── ICE servers ───────────────────────────────────────────────
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
  role?: "doctor" | "patient"; // kept for API compatibility, not used internally
  onIncomingCall?: (callerName: string) => void;
  onCallEnded?: () => void;
}

export function useWebRTC({
  consultationId,
  onIncomingCall,
  onCallEnded,
}: UseWebRTCOptions) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  // Exposed refs for video elements (VideoCallRoom attaches DOM nodes here)
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  if (!localVideoRef.current) {
    localVideoRef.current = document.createElement("video");
  }
  if (!remoteVideoRef.current) {
    remoteVideoRef.current = document.createElement("video");
  }

  const channelName = `call:${consultationId}`;

  // ── Create peer connection ─────────────────────────────────
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

  // ── Get local media ────────────────────────────────────────
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

  // ── Handle offer (common for both sides receiving an offer) ─
  const handleOffer = useCallback(
    async (sdp: RTCSessionDescriptionInit) => {
      setCallState("connecting");
      const pc = createPC();
      const stream = await getLocalMedia();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channelRef.current?.send({
        type: "broadcast",
        event: "answer",
        payload: { sdp: answer },
      });
    },
    [createPC, getLocalMedia],
  );

  // ── Subscribe to signaling channel ────────────────────────
  useEffect(() => {
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      // Incoming call notification
      .on("broadcast", { event: "call-request" }, ({ payload }) => {
        // The OTHER party (not the one who sent it) receives this
        setCallState("incoming");
        onIncomingCall?.(payload.callerName ?? "");
      })
      // Caller sent offer — store it; we process on accept
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (callState === "connecting") {
          // Already accepted — process immediately
          await handleOffer(payload.sdp);
        } else {
          // Store for later (patient may still be on the accept screen)
          pendingOfferRef.current = payload.sdp;
        }
      })
      // Answer from the other party
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(payload.sdp),
          );
        }
      })
      // ICE candidates
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        if (pcRef.current && payload.candidate) {
          try {
            await pcRef.current.addIceCandidate(
              new RTCIceCandidate(payload.candidate),
            );
          } catch (_) {}
        }
      })
      // Remote hung up
      .on("broadcast", { event: "call-ended" }, () => {
        setCallState("ended");
        onCallEnded?.();
        cleanup(false);
      })
      // Callee accepted — caller can now send the offer
      .on("broadcast", { event: "call-accepted" }, async () => {
        // Only the caller (who is waiting) handles this
        if (callState !== "calling" || !pcRef.current) return;
        const offer = pcRef.current.localDescription;
        if (offer) {
          channelRef.current?.send({
            type: "broadcast",
            event: "offer",
            payload: { sdp: offer },
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);

  // ── Initiate call (works for doctor OR patient) ──────────
  const startCall = useCallback(
    async (myName = "") => {
      try {
        setError(null);
        setCallState("calling");

        // Notify the other party
        channelRef.current?.send({
          type: "broadcast",
          event: "call-request",
          payload: { callerName: myName },
        });

        const pc = createPC();
        const stream = await getLocalMedia();
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send the offer immediately — the other side stores it until they
        // accept, then processes it via acceptCall()
        channelRef.current?.send({
          type: "broadcast",
          event: "offer",
          payload: { sdp: offer },
        });
      } catch (_err) {
        setError(
          "Could not access camera/microphone. Please allow permissions.",
        );
        setCallState("error");
      }
    },
    [createPC, getLocalMedia],
  );

  // ── Accept call ───────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    setCallState("connecting");

    if (pendingOfferRef.current) {
      // We already received the offer — process it now
      await handleOffer(pendingOfferRef.current);
      pendingOfferRef.current = null;
    } else {
      // Offer not received yet — signal readiness; offer handler
      // above will process it when it arrives (state is "connecting")
      channelRef.current?.send({
        type: "broadcast",
        event: "call-accepted",
        payload: {},
      });
    }
  }, [handleOffer]);

  // ── Cleanup ───────────────────────────────────────────────
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
    pendingOfferRef.current = null;
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
