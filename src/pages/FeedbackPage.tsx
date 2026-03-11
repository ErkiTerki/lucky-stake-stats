import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useRef } from "react";
import { Mic, Phone, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PARSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-feedback`;
const TOKEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-token`;

interface ParsedEntry {
  type: string;
  group: string;
  tag: string;
  long_description: string;
}

const FeedbackPage = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([]);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("Tap to start");
  const transcriptRef = useRef("");

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to voice agent");
      setConversationEnded(false);
      setStatusMessage("Listening — tap to end");
    },
    onDisconnect: () => {
      console.log("Disconnected from voice agent");
      setConversationEnded(true);
      setStatusMessage("Conversation ended — saving your feedback...");
      if (transcriptRef.current.trim()) {
        submitFeedback(transcriptRef.current);
      } else {
        setError("We couldn't capture the conversation transcript. Please try again.");
        setStatusMessage("Conversation ended");
      }
    },
    onMessage: (message: any) => {
      console.log("ElevenLabs message:", JSON.stringify(message));

      if (message.type === "user_transcript") {
        const text = message.user_transcription_event?.user_transcript || message.text || "";
        if (text.trim()) transcriptRef.current += `\nClient: ${text}`;
      }

      if (message.type === "agent_response") {
        const text = message.agent_response_event?.agent_response || message.text || "";
        if (text.trim()) transcriptRef.current += `\nAgent: ${text}`;
      }
    },
    onError: (err) => {
      console.error("Voice agent error:", err);
      setError("Connection error. Please try again.");
      setStatusMessage("Connection error");
    },
  });

  const submitFeedback = async (text: string) => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    setStatusMessage("Saving your feedback...");

    try {
      const { data, error } = await supabase.functions.invoke("parse-feedback", {
        body: { transcript: text },
      });

      if (error) {
        throw new Error(error.message || "Failed to process feedback");
      }

      if (data?.entries && data.entries.length > 0) {
        setParsedEntries(data.entries.map((e: any) => ({
          type: e.type,
          group: e.group,
          tag: e.tag,
          long_description: e.long_description,
        })));
      }

      setSubmitted(true);
      setStatusMessage("Feedback saved successfully");
    } catch (e: any) {
      console.error("Submit error:", e);
      setError(e.message || "Something went wrong. Please try again.");
      setStatusMessage("Saving failed");
    }

    setSubmitting(false);
  };

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    transcriptRef.current = "";
    setSubmitted(false);
    setConversationEnded(false);
    setParsedEntries([]);
    setError("");
    setStatusMessage("Requesting microphone access...");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatusMessage("Connecting to voice assistant...");

      const { data, error } = await supabase.functions.invoke("elevenlabs-token");
      if (error) throw new Error(error.message || "Failed to get conversation token");
      if (!data?.token) throw new Error("No token received");

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (err: any) {
      console.error("Failed to start conversation:", err);
      setError(err.message || "Failed to connect. Please try again.");
      setStatusMessage("Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    setStatusMessage("Ending conversation...");
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Thank you!</h1>
          <p className="text-muted-foreground mb-4">
            Your feedback has been recorded and is now visible on our analytics dashboard.
          </p>

          {parsedEntries.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 text-left mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                We captured {parsedEntries.length} feedback point{parsedEntries.length > 1 ? "s" : ""}:
              </p>
              <div className="space-y-2">
                {parsedEntries.map((entry, i) => {
                  const isPositive = entry.type.includes("apprécié");
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isPositive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                        {isPositive ? "+" : "−"}
                      </span>
                      <p className="text-sm text-foreground">{entry.tag}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setSubmitted(false);
              setConversationEnded(false);
              setStatusMessage("Tap to start");
              transcriptRef.current = "";
              setParsedEntries([]);
            }}
            className="bg-primary text-primary-foreground rounded-lg px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Give More Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md w-full">
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          Share Your Experience
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Tap the button below and tell us about your visit. Your feedback helps us improve.
        </p>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={isConnected ? stopConversation : startConversation}
            disabled={isConnecting || submitting}
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isConnected
                ? isSpeaking
                  ? "bg-[hsl(var(--warning))] scale-110"
                  : "bg-destructive hover:bg-destructive/90"
                : "bg-primary hover:bg-primary/90"
            } disabled:opacity-40`}
          >
            {isConnecting ? (
              <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : isConnected ? (
              <Phone className="w-8 h-8 text-primary-foreground" />
            ) : (
              <Mic className="w-8 h-8 text-primary-foreground" />
            )}
          </button>

          <p className="text-sm text-muted-foreground">
            {statusMessage}
          </p>

          {conversationEnded && !submitting && !submitted && !error && (
            <p className="text-xs text-muted-foreground">
              We ended the call and are waiting for your feedback to be saved.
            </p>
          )}

          {submitting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Registering your feedback and updating the dashboard...
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
