import React, { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function CameraSender() {
  const videoRef = useRef(null);

  useEffect(() => {
    const socket = io("https://parcelweb.store");
    const room = "live-room";

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:43.209.65.64:3478",
          username: "nat",
          credential: "nat123"
        }
      ]
    });

    socket.emit("join-room", room);

    const start = async () => {
      try {
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        videoRef.current.srcObject = stream;

        
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        
        pc.oniceconnectionstatechange = () => {
          console.log("ICE state:", pc.iceConnectionState);
        };

        
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("Candidate:", event.candidate.candidate);
            socket.emit("ice-candidate", { room, candidate: event.candidate });
          } else {
            console.log("ICE gathering complete");
          }
        };

        
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("offer", { room, offer });

      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    socket.on("answer", async (answer) => {
      console.log("✅ Received answer");
      await pc.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async (candidate) => {
      await pc.addIceCandidate(candidate);
    });

    start();

    return () => {
      pc.close();
      socket.disconnect();
    };

  }, []);

  return (
    <div>
      <h2>Camera Sender</h2>
      <video ref={videoRef} autoPlay playsInline muted />
    </div>
  );
}