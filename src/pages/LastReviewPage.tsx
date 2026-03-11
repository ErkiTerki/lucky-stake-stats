import { useEffect, useState } from "react";
import { ClipboardList, Clock, Tag, Layers, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { translateGroup, translateTag, translateType } from "@/lib/translations";

interface FeedbackEntry {
  id: string;
  type: string;
  group: string;
  tag: string;
  count: number;
  long_description: string;
  source: string;
  created_at: string;
  children: any;
}

const LastReviewPage = () => {
  const [entry, setEntry] = useState<FeedbackEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [translatedDescription, setTranslatedDescription] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const fetchLatestEntry = async (showRefreshingState = false) => {
      if (showRefreshingState) setIsRefreshing(true);

      const { data } = await supabase
        .from("feedback_entries")
        .select("*")
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(1);

      if (data && data.length > 0) {
        setEntry(data[0] as FeedbackEntry);
      }

      setLoading(false);
      if (showRefreshingState) setIsRefreshing(false);
    };

    fetchLatestEntry();

    const channel = supabase
      .channel("last_review_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "feedback_entries" }, (payload) => {
        setEntry(payload.new as FeedbackEntry);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Last Review realtime subscribed");
        }
      });

    const interval = window.setInterval(() => {
      fetchLatestEntry(true);
    }, 5000);

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Translate the description when entry changes
  useEffect(() => {
    if (!entry?.long_description) {
      setTranslatedDescription("");
      return;
    }

    const translateDescription = async () => {
      setIsTranslating(true);
      try {
        const { data, error } = await supabase.functions.invoke("chat", {
          body: {
            messages: [
              {
                role: "user",
                content: `Translate the following French customer feedback to English. Return ONLY the translation, no preamble:\n\n${entry.long_description}`,
              },
            ],
          },
        });

        if (error) throw error;

        // Handle streaming response as text
        if (typeof data === "string") {
          // Parse SSE data
          const lines = data.split("\n");
          let result = "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) result += content;
            } catch {}
          }
          setTranslatedDescription(result || entry.long_description);
        } else if (data?.choices?.[0]?.message?.content) {
          setTranslatedDescription(data.choices[0].message.content);
        } else {
          setTranslatedDescription(entry.long_description);
        }
      } catch (e) {
        console.error("Translation error:", e);
        setTranslatedDescription(entry.long_description);
      }
      setIsTranslating(false);
    };

    translateDescription();
  }, [entry?.id]);

  const isPositive = entry?.type?.includes("apprécié");

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Last Customer Review</h1>
            <p className="text-sm text-muted-foreground">Most recent voice feedback received via ElevenLabs</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Live updates enabled
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>
        ) : !entry ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No voice feedback recorded yet.</p>
              <p className="text-xs mt-1">Share the <span className="font-medium text-primary">/feedback</span> page with a customer to start collecting reviews.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 max-w-2xl">
            {/* Sentiment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {isPositive ? <ThumbsUp className="w-4 h-4 text-primary" /> : <ThumbsDown className="w-4 h-4 text-destructive" />}
                  Sentiment
                </CardTitle>
              </CardHeader>
               <CardContent>
                <Badge variant={isPositive ? "default" : "destructive"} className="text-sm">
                  {translateType(entry.type)}
                </Badge>
              </CardContent>
            </Card>

            {/* Group & Tag */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Group
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-foreground">{translateGroup(entry.group)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.group}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    Tag
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-foreground">{translateTag(entry.tag)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Customer Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {isTranslating ? (
                  <p className="text-sm text-muted-foreground italic">Translating...</p>
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">{translatedDescription || entry.long_description}</p>
                )}
              </CardContent>
            </Card>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(entry.created_at).toLocaleString()}</span>
              <Badge variant="outline" className="text-[10px]">{entry.source}</Badge>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LastReviewPage;
