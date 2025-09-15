import { useState, useEffect, useRef } from "react";
import { useUser } from "@/contexts/user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, MessageCircle, Home } from "lucide-react";
import { format } from "date-fns";
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
}

interface ClientConversation {
  id: number;
  agentId: number;
  agentName: string;
  agentAvatar?: string;
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
  lastMessage: string;
  lastMessageTime: string;
  status: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  // Load conversations
  useEffect(() => {
    if (user?.email && user?.isClient) {
      fetchConversations();
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
          senderType: 'client'
        }),
      });

      if (!response.ok) {
        throw new Error("Error al enviar mensaje");
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
      
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido enviado al agente",
      });
      
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

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (loading) {
    return (
      <Card className="h-[600px]">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Cargando conversaciones...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" />
          Mis Conversaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex h-[520px]">
          {/* Conversations List */}
          <div className="w-80 border-r bg-gray-50">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por agente o propiedad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="overflow-y-auto h-full">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? "No se encontraron conversaciones" : "No hay conversaciones"}
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
                      selectedConversation?.id === conversation.id ? 'bg-green-50 border-green-200' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.agentAvatar} />
                        <AvatarFallback className="bg-green-500 text-white">
                          {getInitials(conversation.agentName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate">
                            {conversation.agentName}
                          </h3>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Home className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-600 truncate">
                            {conversation.propertyAddress}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.status === 'pendiente' && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Pendiente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-white">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.agentAvatar} />
                      <AvatarFallback className="bg-green-500 text-white">
                        {getInitials(selectedConversation.agentName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{selectedConversation.agentName}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Home className="h-3 w-3" />
                        <span>{selectedConversation.propertyAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'client' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderType === 'client'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderType === 'client' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe un mensaje..."
                      className="flex-1"
                      disabled={sendingMessage}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>Selecciona una conversación para empezar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}