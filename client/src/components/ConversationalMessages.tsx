import { useState, useEffect, useRef, type MouseEvent } from "react";
import { useUser } from "@/contexts/user-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Send, MessageCircle, Home, Pin, PinOff, User, Mail, Phone, Calendar, MapPin, Briefcase, Users, Heart, Clock, Euro } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderType: 'client' | 'agent';
  content: string;
  timestamp: string;
  isRead: boolean;
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
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pinnedConversations, setPinnedConversations] = useState<number[]>([]);
  const [pinningConversation, setPinningConversation] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  // Load conversations and pinned conversations
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
      fetchPinnedConversations();
    }
  }, [user?.id]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/agent/${user!.id}`);
      
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
        throw new Error(errorData.error || 'Error al fijar conversación');
      }

      // Update local state
      setPinnedConversations(prev => [...prev, inquiryId]);
      
      toast({
        title: "Éxito",
        description: "Conversación fijada correctamente",
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
        throw new Error('Error al desfijar conversación');
      }

      // Update local state
      setPinnedConversations(prev => prev.filter(id => id !== inquiryId));
      
      toast({
        title: "Éxito",
        description: "Conversación desfijada correctamente",
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
    setSelectedClientId(clientId);
    setShowClientModal(true);
  };

  // Fetch client details for modal
  const { data: clientDetails, isLoading: loadingClientDetails } = useQuery({
    queryKey: ['/api/clients', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      const response = await fetch(`/api/clients/${selectedClientId}`);
      if (!response.ok) {
        throw new Error('Error fetching client details');
      }
      return response.json();
    },
    enabled: !!selectedClientId && showClientModal,
  });

  // Close client modal
  const handleCloseClientModal = () => {
    setShowClientModal(false);
    setSelectedClientId(null);
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
          <MessageCircle className="h-5 w-5 text-blue-500" />
          Mensajes
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
                  placeholder="Buscar por cliente o propiedad..."
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
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      markAsRead(conversation.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {getInitials(conversation.clientName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 
                            className="font-medium text-sm truncate text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                            onClick={(e) => handleClientNameClick(conversation.clientId, e)}
                            data-testid={`link-client-name-${conversation.clientId}`}
                            title="Ver información del cliente"
                          >
                            <User className="h-3 w-3" />
                            {conversation.clientName}
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

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-500 text-white">
                          {getInitials(selectedConversation.clientName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                          onClick={(e) => handleClientNameClick(selectedConversation.clientId, e)}
                          data-testid={`link-client-header-${selectedConversation.clientId}`}
                          title="Ver información del cliente"
                        >
                          <User className="h-4 w-4" />
                          {selectedConversation.clientName}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Home className="h-3 w-3" />
                          <span>{selectedConversation.propertyAddress}</span>
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
                      className="h-8 w-8 p-0 hover:bg-gray-100"
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
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderType === 'agent'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderType === 'agent' ? 'text-blue-100' : 'text-gray-500'
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

      {/* Client Information Modal */}
      <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </DialogTitle>
          </DialogHeader>
          
          {loadingClientDetails ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">Cargando información del cliente...</div>
            </div>
          ) : clientDetails ? (
            <div className="space-y-6">
              {/* Client Header */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={clientDetails.avatar} />
                  <AvatarFallback className="bg-blue-500 text-white text-lg">
                    {getInitials(`${clientDetails.name} ${clientDetails.surname}`)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{clientDetails.name} {clientDetails.surname}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    {clientDetails.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{clientDetails.email}</span>
                      </div>
                    )}
                    {clientDetails.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{clientDetails.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              {clientDetails.employmentStatus && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Información Laboral
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Estado laboral:</span>
                      <p className="text-sm">{clientDetails.employmentStatus}</p>
                    </div>
                    {clientDetails.position && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Posición:</span>
                        <p className="text-sm">{clientDetails.position}</p>
                      </div>
                    )}
                    {clientDetails.yearsAtPosition && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Años en el puesto:</span>
                        <p className="text-sm">{clientDetails.yearsAtPosition}</p>
                      </div>
                    )}
                    {clientDetails.monthlyIncome && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Ingresos mensuales:</span>
                        <p className="text-sm flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          {clientDetails.monthlyIncome.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Housing Information */}
              {(clientDetails.numberOfPeople || clientDetails.relationship || clientDetails.hasMinors || clientDetails.hasAdolescents) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Composición Familiar
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {clientDetails.numberOfPeople && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Número de personas:</span>
                        <p className="text-sm">{clientDetails.numberOfPeople}</p>
                      </div>
                    )}
                    {clientDetails.relationship && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Estado civil:</span>
                        <p className="text-sm">{clientDetails.relationship}</p>
                      </div>
                    )}
                    {clientDetails.hasMinors !== null && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Menores de edad:</span>
                        <p className="text-sm">{clientDetails.hasMinors ? 'Sí' : 'No'}</p>
                      </div>
                    )}
                    {clientDetails.hasAdolescents !== null && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Adolescentes:</span>
                        <p className="text-sm">{clientDetails.hasAdolescents ? 'Sí' : 'No'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pet Information */}
              {clientDetails.petsStatus && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Mascotas
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Estado:</span>
                      <p className="text-sm">{clientDetails.petsStatus}</p>
                    </div>
                    {clientDetails.petsDescription && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Descripción:</span>
                        <p className="text-sm">{clientDetails.petsDescription}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Move-in Timeline */}
              {(clientDetails.moveInTiming || clientDetails.moveInDate) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Fecha de Mudanza
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {clientDetails.moveInTiming && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Urgencia:</span>
                        <p className="text-sm">{clientDetails.moveInTiming}</p>
                      </div>
                    )}
                    {clientDetails.moveInDate && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Fecha específica:</span>
                        <p className="text-sm flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(clientDetails.moveInDate), "dd/MM/yyyy", { locale: es })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-red-500">Error al cargar la información del cliente</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}