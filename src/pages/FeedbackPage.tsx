import { useConversation } from "@elevenlabs/react";
import { useState, useCallback } from "react";
import { Mic, MicOff, Phone } from "lucide-react";

const PARSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-feedback`;
const AGENT_ID = "agent_8501kkf2b8qefkgs7fsggrk7b1gm";

const FeedbackPage = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const conversation = useConversation({
    onConnect: () => console.log("Connected to voice agent"),
    onDisconnect: () => {
      console.log("Disconnected from voice agent");
      // After disconnect, if we have a transcript, parse it
      if (transcript.trim()) {
        submitFeedback(transcript);
      }
    },
    onMessage: (message: any) => {
      if (message.type === "user_transcript") {
        setTranscript((prev) => prev + " " + (message.user_transcription_event?.user_transcript || ""));
      }
    },
    onError: (error) => console.error("Voice agent error:", error),
  });

  const submitFeedback = async (text: string) => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const resp = await fetch(PARSE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ transcript: text }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error("Parse error:", err);
      }
      setSubmitted(true);
    } catch (e) {
      console.error("Submit error:", e);
    }
    setSubmitting(false);
  };

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setTranscript("");
    setSubmitted(false);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: AGENT_ID,
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  if (submitted) {
    return (
      <div className="min-h-screen bg-[hsl(80,20%,97%)] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-[hsl(145,45%,42%)]/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[hsl(145,45%,42%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[hsl(160,10%,12%)] mb-2">Thank you!</h1>
          <p className="text-[hsl(160,6%,50%)]">Your feedback has been recorded and will help us improve your experience.</p>
          <button
            onClick={() => { setSubmitted(false); setTranscript(""); }}
            className="mt-6 bg-[hsl(145,45%,42%)] text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Give More Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(80,20%,97%)] flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md w-full">
        <h1 className="text-2xl font-semibold text-[hsl(160,10%,12%)] mb-1">
          Share Your Experience
        </h1>
        <p className="text-sm text-[hsl(160,6%,50%)] mb-10">
          Tap the button below and tell us about your visit. Your feedback helps us improve.
        </p>

        {/* Voice button */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={isConnected ? stopConversation : startConversation}
            disabled={isConnecting || submitting}
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isConnected
                ? isSpeaking
                  ? "bg-[hsl(38,90%,55%)] scale-110 shadow-[hsl(38,90%,55%)]/30"
                  : "bg-[hsl(0,55%,55%)] hover:bg-[hsl(0,55%,50%)] shadow-[hsl(0,55%,55%)]/20"
                : "bg-[hsl(145,45%,42%)] hover:bg-[hsl(145,45%,38%)] shadow-[hsl(145,45%,42%)]/20"
            } disabled:opacity-40`}
          >
            {isConnecting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isConnected ? (
              <Phone className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>

          <p className="text-sm text-[hsl(160,6%,50%)]">
            {isConnecting
              ? "Connecting..."
              : isConnected
                ? isSpeaking
                  ? "Agent is speaking..."
                  : "Listening — tap to end"
                : "Tap to start"}
          </p>

          {submitting && (
            <p className="text-sm text-[hsl(160,6%,50%)]">Processing your feedback...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
