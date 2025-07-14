import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, Home, Users, UserCheck } from "lucide-react";
import { type AgentEvent, type PropertyVisitRequest, type Client } from "@shared/schema";

interface ClientHistoryTimelineProps {
  clientId: number;
  agentId: number;
}

interface TimelineEvent {
  id: string;
  type: 'event' | 'visit_request' | 'client_created';
  date: string;
  time?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  eventType?: string;
  property?: {
    id: number;
    reference: string;
    address: string;
  };
}

export function ClientHistoryTimeline({ clientId, agentId }: ClientHistoryTimelineProps) {
  // Fetch client events
  const { data: events = [] } = useQuery<AgentEvent[]>({
    queryKey: ["/api/agents", agentId, "events", "client", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/events?clientId=${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch client events");
      return response.json();
    }
  });

  // Fetch property visit requests
  const { data: visitRequests = [] } = useQuery<PropertyVisitRequest[]>({
    queryKey: ["/api/clients", clientId, "visit-requests"],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/visit-requests`);
      if (!response.ok) throw new Error("Failed to fetch visit requests");
      return response.json();
    }
  });

  // Fetch client details for creation date
  const { data: client } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch client details");
      return response.json();
    }
  });

  // Fetch properties for reference
  const { data: properties = [] } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    }
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Visita':
        return <Home className="h-4 w-4" />;
      case 'Llamada':
        return <Phone className="h-4 w-4" />;
      case 'Seguimiento':
        return <Users className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'Visita':
        return 'Visita a la propiedad';
      case 'Llamada':
        return 'Llamada de seguimiento';
      case 'Seguimiento':
        return 'Seguimiento';
      default:
        return type;
    }
  };

  // Combine all events into a timeline
  const timelineEvents: TimelineEvent[] = [
    // Agent events
    ...events.map(event => {
      const property = properties.find(p => p.id === event.propertyId);
      return {
        id: `event-${event.id}`,
        type: 'event' as const,
        date: event.eventDate,
        time: event.eventTime,
        title: getEventTypeLabel(event.eventType),
        description: event.comments || (property ? `Propiedad: ${property.address}` : 'Sin descripción'),
        icon: getEventIcon(event.eventType),
        eventType: event.eventType,
        property: property ? {
          id: property.id,
          reference: property.reference,
          address: property.address
        } : undefined
      };
    }),

    // Visit requests
    ...visitRequests.map(request => {
      const property = properties.find(p => p.id === request.propertyId);
      return {
        id: `visit-${request.id}`,
        type: 'visit_request' as const,
        date: request.requestedDate.toString().split('T')[0],
        time: request.requestedTime,
        title: 'Solicitud de visita',
        description: property ? `Propiedad: ${property.address}` : 'Solicitud de visita a propiedad',
        icon: <Calendar className="h-4 w-4" />,
        property: property ? {
          id: property.id,
          reference: property.reference,
          address: property.address
        } : undefined
      };
    }),

    // Client creation
    ...(client ? [{
      id: `client-created-${client.id}`,
      type: 'client_created' as const,
      date: client.createdAt?.toString().split('T')[0] || new Date().toISOString().split('T')[0],
      title: 'Cliente potencial creado',
      description: 'Cliente añadido al CRM',
      icon: <UserCheck className="h-4 w-4" />
    }] : [])
  ];

  // Sort timeline events by date and time (newest first)
  const sortedEvents = timelineEvents.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
    const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
    return dateB.getTime() - dateA.getTime();
  });

  if (sortedEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Sin historial</h3>
            <p className="mt-1 text-gray-500">
              Aún no hay eventos registrados para este cliente
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Historial del Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="flex items-start gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  {event.icon}
                </div>
                {index < sortedEvents.length - 1 && (
                  <div className="w-px h-8 bg-gray-300 mt-2" />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  {event.eventType && (
                    <Badge variant="outline" className="text-xs">
                      {event.eventType}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    {format(new Date(event.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </span>
                  {event.time && (
                    <>
                      <span>•</span>
                      <span>{event.time}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}