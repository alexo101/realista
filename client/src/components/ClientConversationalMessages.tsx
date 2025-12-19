import { useState, useEffect, useRef } from "react";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, MessageCircle, Home, Pin, ArrowLeft, Check, CheckCheck, Building2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

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

function MessageStatusIndicator({ status, isClientMessage }: { status: string; isClientMessage: boolean }) {
  if (!isClientMessage) return null;
  
  switch (status) {
    case 'read':
      return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    case 'delivered':
      return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
    case 'sent':
    default:
      return <Check className="h-3.5 w-3.5 text-gray-400" />;
  }
}

interface ClientConversation {
  id: number;
  agentId: number;
  agentName: string;
  agentAvatar?: string;
  agencyName?: string;
  agencyLogo?: string;
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  lastMessage: string;
  lastMessageTime: string;
  status: string;
  unreadCount?: number;
  messages: Message[];
}

export function ClientConversationalMessages() {
  const { user } = useUser();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ClientConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ClientConversation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pinnedConversations, setPinnedConversations] = useState<number[]>([]);
  const [pinningConversation, setPinningConversation] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  useEffect(() => {
    if (user?.email && user?.isClient) {
      fetchConversations();
      fetchPinnedConversations();
      
      const pollInterval = setInterval(() => {
        refreshConversations();
      }, 30000);
      
      return () => clearInterval(pollInterval);
    }
  }, [user?.email, user?.isClient]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/client/${encodeURIComponent(user!.email)}`);
      
      if (!response.ok) {
        throw new Error("Error al cargar conversaciones");
      }
      
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Error al cargar conversaciones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const refreshConversations = async () => {
    try {
      const response = await fetch(`/api/conversations/client/${encodeURIComponent(user!.email)}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        
        if (selectedConversation) {
          const updated = data.find((c: ClientConversation) => c.id === selectedConversation.id);
          if (updated) {
            setSelectedConversation(updated);
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing conversations:", error);
    }
  };

  const fetchPinnedConversations = async () => {
    try {
      const response = await fetch(`/api/conversations/pinned?userType=client&userId=0&userEmail=${encodeURIComponent(user!.email)}`);
      if (response.ok) {
        const pinnedIds = await response.json();
        setPinnedConversations(pinnedIds);
      }
    } catch (error) {
      console.error("Error loading pinned conversations:", error);
    }
  };

  const pinConversation = async (inquiryId: number) => {
    try {
      setPinningConversation(inquiryId);
      const response = await fetch(`/api/conversations/${inquiryId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType: 'client',
          userId: 0,
          userEmail: user!.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al fijar conversación');
      }

      setPinnedConversations(prev => [...prev, inquiryId]);
      
      toast({
        title: "Conversación fijada",
        description: "La conversación aparecerá primero en la lista",
      });
    } catch (error) {
      console.error("Error pinning conversation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo fijar la conversación",
        variant: "destructive",
      });
    } finally {
      setPinningConversation(null);
    }
  };

  const unpinConversation = async (inquiryId: number) => {
    try {
      setPinningConversation(inquiryId);
      const response = await fetch(`/api/conversations/${inquiryId}/pin`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType: 'client',
          userId: 0,
          userEmail: user!.email
        })
      });

      if (!response.ok) {
        throw new Error('Error al desfijar conversación');
      }

      setPinnedConversations(prev => prev.filter(id => id !== inquiryId));
      
      toast({
        title: "Conversación desfijada",
      });
    } catch (error) {
      console.error("Error unpinning conversation:", error);
      toast({
        title: "Error",
        description: "No se pudo desfijar la conversación",
        variant: "destructive",
      });
    } finally {
      setPinningConversation(null);
    }
  };

  const markConversationAsRead = async (conversationId: number) => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ readerType: 'client' })
      });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const selectConversation = (conversation: ClientConversation) => {
    setSelectedConversation(conversation);
    markConversationAsRead(conversation.id);
    
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversation.id) {
        return {
          ...conv,
          unreadCount: 0,
          messages: conv.messages.map(msg => ({
            ...msg,
            status: msg.senderType === 'agent' ? 'read' as const : msg.status
          }))
        };
      }
      return conv;
    }));
  };

  const goBackToList = () => {
    setSelectedConversation(null);
  };

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
          senderType: 'client'
        }),
      });

      if (!response.ok) {
        throw new Error("Error al enviar mensaje");
      }

      const newMsg = await response.json();
      
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, newMsg],
          lastMessage: newMessage,
          lastMessageTime: new Date().toISOString()
        };
      });

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
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations
    .filter(
      (conversation) =>
        conversation.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.agencyName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aIsPinned = pinnedConversations.includes(a.id);
      const bIsPinned = pinnedConversations.includes(b.id);
      
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

  const formatTimeShort = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      if (isToday(date)) {
        return format(date, "HH:mm");
      } else if (isYesterday(date)) {
        return "Ayer";
      } else {
        const dayName = format(date, "EEE", { locale: es });
        return dayName.charAt(0).toUpperCase() + dayName.slice(1);
      }
    } catch (e) {
      return "";
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm");
    } catch (e) {
      return "";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUnreadCount = (conversation: ClientConversation) => {
    if (conversation.unreadCount !== undefined) {
      return conversation.unreadCount;
    }
    return conversation.messages.filter(
      m => m.senderType === 'agent' && !m.isRead
    ).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 md:h-[500px]">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  const ConversationsList = () => (
    <div className="bg-white md:border-r h-full flex flex-col">
      <div className="p-3 md:p-4 border-b sticky top-0 bg-white z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full bg-gray-100 border-0"
            data-testid="input-search-conversations"
          />
        </div>
      </div>
      
      <div className="divide-y flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? "No se encontraron conversaciones" : "No hay conversaciones"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const unreadCount = getUnreadCount(conversation);
            const isPinned = pinnedConversations.includes(conversation.id);
            const isSelected = selectedConversation?.id === conversation.id;
            
            return (
              <div
                key={conversation.id}
                className={`flex items-center gap-3 p-3 md:p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                  isPinned ? 'bg-primary/5' : ''
                } ${isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
                onClick={() => selectConversation(conversation)}
                data-testid={`conversation-item-${conversation.id}`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.agentAvatar || conversation.agencyLogo} />
                    <AvatarFallback className="bg-primary text-white">
                      {conversation.agencyName 
                        ? <Building2 className="h-5 w-5" />
                        : getInitials(conversation.agentName)
                      }
                    </AvatarFallback>
                  </Avatar>
                  {isPinned && (
                    <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                      <Pin className="h-2.5 w-2.5 text-white fill-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate text-sm">
                      {conversation.agencyName || conversation.agentName}
                      {!conversation.agencyName && " - Agente"}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTimeShort(conversation.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {conversation.lastMessage}
                  </p>
                </div>
                
                {unreadCount > 0 && (
                  <div className="flex-shrink-0 bg-primary text-white text-xs font-medium rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {unreadCount}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const ChatView = () => {
    if (!selectedConversation) {
      return (
        <div className="hidden md:flex items-center justify-center h-full bg-gray-50 text-gray-500">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg">Selecciona una conversación</p>
            <p className="text-sm text-gray-400 mt-1">para ver los mensajes</p>
          </div>
        </div>
      );
    }

    const isPinned = pinnedConversations.includes(selectedConversation.id);
    
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center gap-3 p-3 md:p-4 border-b bg-white sticky top-0 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBackToList}
            className="p-2 md:hidden"
            data-testid="button-back-to-list"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={selectedConversation.agentAvatar || selectedConversation.agencyLogo} />
            <AvatarFallback className="bg-primary text-white">
              {selectedConversation.agencyName 
                ? <Building2 className="h-5 w-5" />
                : getInitials(selectedConversation.agentName)
              }
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
              {selectedConversation.agencyName || selectedConversation.agentName}
              {!selectedConversation.agencyName && " - Agente"}
            </h3>
            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
              <Home className="h-3 w-3 flex-shrink-0" />
              {selectedConversation.propertyTitle || selectedConversation.propertyAddress}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => isPinned ? unpinConversation(selectedConversation.id) : pinConversation(selectedConversation.id)}
            disabled={pinningConversation === selectedConversation.id}
            className="p-2"
            data-testid={`button-pin-conversation-${selectedConversation.id}`}
          >
            <Pin className={`h-5 w-5 ${isPinned ? 'text-primary fill-primary' : 'text-gray-400'}`} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-gray-50">
          {selectedConversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderType === 'client' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] px-3 py-2 rounded-2xl ${
                  message.senderType === 'client'
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${
                  message.senderType === 'client' ? 'text-primary-foreground/70' : 'text-gray-400'
                }`}>
                  <span className="text-[10px]">{formatMessageTime(message.timestamp)}</span>
                  <MessageStatusIndicator 
                    status={message.status || 'sent'} 
                    isClientMessage={message.senderType === 'client'} 
                  />
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 md:p-4 border-t bg-white">
          <div className="flex gap-2 items-end">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className="flex-1 rounded-full"
              disabled={sendingMessage}
              data-testid="input-message"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              size="icon"
              className="rounded-full h-10 w-10 flex-shrink-0"
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border h-[calc(100vh-280px)] md:h-[600px] overflow-hidden">
      <div className="md:hidden h-full">
        {selectedConversation ? (
          <ChatView />
        ) : (
          <ConversationsList />
        )}
      </div>
      
      <div className="hidden md:flex h-full">
        <div className="w-80 lg:w-96 flex-shrink-0 h-full overflow-hidden">
          <ConversationsList />
        </div>
        <div className="flex-1 h-full overflow-hidden">
          <ChatView />
        </div>
      </div>
    </div>
  );
}
