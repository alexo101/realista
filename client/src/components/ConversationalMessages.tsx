import { useState, useEffect, useRef, type MouseEvent } from "react";
import { useUser } from "@/contexts/user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, Home, Pin, Check, CheckCheck, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/language-context";

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderType: 'client' | 'agent';
  content: string;
  timestamp: string;
  isRead: boolean;
  status: 'sent' | 'delivered' | 'read';
}

// Message status indicator component (WhatsApp-style check marks)
// Colors adjusted to be visible on blue background of agent messages
function MessageStatusIndicator({ status, isAgentMessage }: { status: string; isAgentMessage: boolean }) {
  if (!isAgentMessage) return null; // Only show for agent's own messages
  
  switch (status) {
    case 'read':
      // Double blue checks - use cyan/light blue for visibility on blue background
      return <CheckCheck className="h-3.5 w-3.5 text-cyan-300" />;
    case 'delivered':
      // Double grey checks - use white/light for visibility on blue background
      return <CheckCheck className="h-3.5 w-3.5 text-white/70" />;
    case 'sent':
    default:
      // Single grey check - use white/light for visibility on blue background
      return <Check className="h-3.5 w-3.5 text-white/70" />;
  }
}

interface Conversation {
  id: number;
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'closed';
  messages: Message[];
}

export function ConversationalMessages() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pinnedConversations, setPinnedConversations] = useState<number[]>([]);
  const [pinningConversation, setPinningConversation] = useState<number | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  // Load conversations and pinned conversations with polling for status updates
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
      fetchPinnedConversations();
      
      // Poll every 30 seconds to get updated message statuses
      const pollInterval = setInterval(() => {
        refreshConversations();
      }, 30000);
      
      return () => clearInterval(pollInterval);
    }
  }, [user?.id]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/agent/${user!.id}`);
      
      if (!response.ok) {
        throw new Error(t("messages.load_error"));
      }
      
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Error al cargar conversaciones:", error);
      toast({
        title: t("common.error"),
        description: t("messages.load_error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Silent refresh without loading state (for polling)
  const refreshConversations = async () => {
    try {
      const response = await fetch(`/api/conversations/agent/${user!.id}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        
        // Update selected conversation if it exists
        if (selectedConversation) {
          const updated = data.find((c: Conversation) => c.id === selectedConversation.id);
          if (updated) {
            setSelectedConversation(updated);
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing conversations:", error);
    }
  };

  // Fetch pinned conversations
  const fetchPinnedConversations = async () => {
    try {
      const response = await fetch(`/api/conversations/pinned?userType=agent&userId=${user!.id}&userEmail=null`);
      if (response.ok) {
        const pinnedIds = await response.json();
        setPinnedConversations(pinnedIds);
      }
    } catch (error) {
      console.error("Error loading pinned conversations:", error);
    }
  };

  // Pin a conversation
  const pinConversation = async (inquiryId: number) => {
    try {
      setPinningConversation(inquiryId);
      const response = await fetch(`/api/conversations/${inquiryId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType: 'agent',
          userId: user!.id,
          userEmail: null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("messages.pin_error"));
      }

      // Update local state
      setPinnedConversations(prev => [...prev, inquiryId]);
      
      toast({
        title: t("common.success"),
        description: t("messages.pin_success"),
      });
    } catch (error) {
      console.error("Error pinning conversation:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("messages.pin_error"),
        variant: "destructive",
      });
    } finally {
      setPinningConversation(null);
    }
  };

  // Unpin a conversation
  const unpinConversation = async (inquiryId: number) => {
    try {
      setPinningConversation(inquiryId);
      const response = await fetch(`/api/conversations/${inquiryId}/pin`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType: 'agent',
          userId: user!.id,
          userEmail: null
        })
      });

      if (!response.ok) {
        throw new Error(t("messages.unpin_error"));
      }

      // Update local state
      setPinnedConversations(prev => prev.filter(id => id !== inquiryId));
      
      toast({
        title: t("common.success"),
        description: t("messages.unpin_success"),
      });
    } catch (error) {
      console.error("Error unpinning conversation:", error);
      toast({
        title: t("common.error"),
        description: t("messages.unpin_error"),
        variant: "destructive",
      });
    } finally {
      setPinningConversation(null);
    }
  };

  // Mark messages as read when opening a conversation
  const markConversationAsRead = async (conversationId: number) => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ readerType: 'agent' })
      });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  // Handle conversation selection and mark as read
  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMobileShowChat(true);
    markConversationAsRead(conversation.id);
    
    // Update local message status to 'read' for client's messages
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversation.id) {
        return {
          ...conv,
          messages: conv.messages.map(msg => ({
            ...msg,
            status: msg.senderType === 'client' ? 'read' as const : msg.status
          }))
        };
      }
      return conv;
    }));
  };

  // Handle back button on mobile
  const handleMobileBack = () => {
    setMobileShowChat(false);
  };

  // Send message
  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          senderType: 'agent'
        }),
      });

      if (!response.ok) {
        throw new Error(t("messages.send_error"));
      }

      const newMsg = await response.json();
      
      // Update conversation with new message
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, newMsg],
          lastMessage: newMessage,
          lastMessageTime: new Date().toISOString()
        };
      });

      // Update conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: newMessage, lastMessageTime: new Date().toISOString() }
            : conv
        )
      );

      setNewMessage("");
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      toast({
        title: t("common.error"),
        description: t("messages.send_error"),
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filter conversations based on search and sort by pinned status
  const filteredConversations = conversations
    .filter(conv =>
      conv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort pinned conversations first
      const aIsPinned = pinnedConversations.includes(a.id);
      const bIsPinned = pinnedConversations.includes(b.id);
      
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      
      // For conversations with same pin status, sort by last message time (most recent first)
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

  // Mark conversation as read
  const markAsRead = async (conversationId: number) => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: "PATCH",
      });
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return format(date, "HH:mm");
      } else {
        return format(date, "dd/MM/yyyy");
      }
    } catch (e) {
      return dateString;
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Handle client name click
  const handleClientNameClick = (clientId: number, event: MouseEvent) => {
    event.stopPropagation(); // Prevent triggering conversation selection
    if (user?.agentUuid) {
      navigate(`/gestionar/${user.agentUuid}/clientes/${clientId}`);
    }
  };

  if (loading) {
    return (
      <Card className="h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] flex flex-col overflow-hidden">
        <CardContent className="p-4 md:p-6 flex-1">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-sm md:text-base">{t("messages.loading")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] flex flex-col overflow-hidden">
      <CardHeader className="px-3 py-3 md:px-6 md:py-4 shrink-0">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          {t("messages.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <div className="flex flex-col md:flex-row h-full">
          {/* Conversations List - hidden on mobile when viewing chat */}
          <div className={`w-full md:w-80 lg:w-96 border-r bg-gray-50 flex flex-col h-full ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-3 md:p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("messages.search_placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm md:text-base"
                  data-testid="input-search-conversations"
                />
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 min-h-0">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm md:text-base">
                  {searchTerm ? t("messages.no_results") : t("messages.empty")}
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 md:p-4 border-b cursor-pointer hover:bg-gray-100 ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => selectConversation(conversation)}
                    data-testid={`conversation-item-${conversation.id}`}
                  >
                    <div className="flex items-start gap-2 md:gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-[#0284c5] text-white text-sm">
                          {getInitials(conversation.clientName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 
                            className="font-medium text-sm truncate text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                            onClick={(e) => handleClientNameClick(conversation.clientId, e)}
                            data-testid={`link-client-name-${conversation.clientId}`}
                            title={t("messages.view_client")}
                          >
                            <span className="truncate text-[#0284c5]">{conversation.clientName}</span>
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Home className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-600 truncate">
                            {conversation.propertyAddress}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area - hidden on mobile when not viewing chat, full width on mobile */}
          <div className={`flex-1 flex flex-col w-full min-h-0 ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 md:p-4 border-b bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      {/* Back button - only visible on mobile */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMobileBack}
                        className="md:hidden h-8 w-8 p-0 flex-shrink-0"
                        data-testid="button-back-mobile"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
                        <AvatarFallback className="bg-[#0284c5] text-white text-sm">
                          {getInitials(selectedConversation.clientName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 
                          className="font-medium text-sm md:text-base text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                          onClick={(e) => handleClientNameClick(selectedConversation.clientId, e)}
                          data-testid={`link-client-header-${selectedConversation.clientId}`}
                          title={t("messages.view_client")}
                        >
                          <span className="truncate text-[#0284c5]">{selectedConversation.clientName}</span>
                        </h3>
                        <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                          <Home className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{selectedConversation.propertyAddress}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Pin Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const isPinned = pinnedConversations.includes(selectedConversation.id);
                        if (isPinned) {
                          unpinConversation(selectedConversation.id);
                        } else {
                          pinConversation(selectedConversation.id);
                        }
                      }}
                      disabled={pinningConversation === selectedConversation.id}
                      data-testid={`button-pin-conversation-${selectedConversation.id}`}
                      className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
                    >
                      {pinnedConversations.includes(selectedConversation.id) ? (
                        <Pin className="h-4 w-4 text-blue-500 fill-blue-500" />
                      ) : (
                        <Pin className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[85%] sm:max-w-[80%] md:max-w-md lg:max-w-lg xl:max-w-xl px-3 md:px-4 py-2 rounded-lg break-words text-white bg-[#0284c5]"
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-white">
                          <span className="text-xs font-medium">{formatTime(message.timestamp)}</span>
                          <MessageStatusIndicator 
                            status={message.status || 'sent'} 
                            isAgentMessage={message.senderType === 'agent'} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input - optimized for mobile keyboards */}
                <div className="p-2 md:p-4 border-t bg-gray-50 safe-area-pb">
                  <div className="flex gap-2 items-end">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t("messages.write_placeholder")}
                      className="flex-1 text-base md:text-sm min-h-[44px] md:min-h-0"
                      disabled={sendingMessage}
                      data-testid="input-new-message"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      size="sm"
                      className="h-11 w-11 md:h-9 md:w-auto md:px-3 p-0 flex-shrink-0"
                      data-testid="button-send-message"
                    >
                      <Send className="h-5 w-5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 p-4">
                <div className="text-center">
                  <p className="text-sm md:text-base">{t("messages.select_conversation")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}