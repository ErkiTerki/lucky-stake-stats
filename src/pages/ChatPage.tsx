import DashboardSidebar from "@/components/DashboardSidebar";
import ChatPageContent from "@/components/ChatContent";

const ChatPage = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 min-w-0">
        <ChatPageContent />
      </div>
    </div>
  );
};

export default ChatPage;
