import { useEffect, useState } from "react";
import { ClipboardList, Clock, Tag, Layers, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { translateGroup } from "@/lib/translations";

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

  useEffect(() => {
    const fetchLatestEntry = async (showRefreshingState = false) => {
      if (showRefreshingState) setIsRefreshing(true);

      const { data } = await supabase
        .from("feedback_entries")
        .select("*")
        .order("created_at", { ascending: false })
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

  const isPositive = entry?.type?.includes("apprécié");

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold text-foreground mb-1">Last Customer Review</h1>
        <p className="text-sm text-muted-foreground mb-8">Most recent voice feedback received via ElevenLabs</p>

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
                  {isPositive ? <ThumbsUp className="w-4 h-4 text-emerald-500" /> : <ThumbsDown className="w-4 h-4 text-rose-500" />}
                  Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={isPositive ? "default" : "destructive"} className="text-sm">
                  {entry.type}
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
                  <p className="text-sm font-medium text-foreground">{entry.tag}</p>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Customer Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed">{entry.long_description}</p>
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
