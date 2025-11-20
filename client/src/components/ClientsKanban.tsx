import { useMemo } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Mail, Phone, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Client } from "@shared/schema";

const CLIENT_STATUSES = [
  { value: "Nuevo", label: "Nuevo", color: "bg-blue-500" },
  { value: "Contactado", label: "Contactado", color: "bg-yellow-500" },
  { value: "En seguimiento", label: "En seguimiento", color: "bg-green-500" },
  { value: "Visitando / Programando visita", label: "Visitando / Programando visita", color: "bg-orange-500" },
  { value: "Oferta realizada", label: "Oferta realizada", color: "bg-purple-500" },
  { value: "En negociación", label: "En negociación", color: "bg-amber-700" },
  { value: "Reservado / En proceso de cierre", label: "Reservado / En proceso de cierre", color: "bg-teal-500" },
  { value: "Ganado", label: "Ganado", color: "bg-green-600" },
  { value: "Perdido / No interesado", label: "Perdido / No interesado", color: "bg-gray-500" },
  { value: "Inactivo", label: "Inactivo", color: "bg-red-500" }
] as const;

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CLIENT',
    item: { clientId: client.id, currentStatus: client.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`bg-white border border-gray-200 rounded p-3 hover:shadow-md transition-all cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
      data-testid={`kanban-card-client-${client.id}`}
    >
      <div className="space-y-2">
        <div className="font-medium text-sm">
          {client.name} {client.surname || ''}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span>{client.phone}</span>
          </div>
        </div>
        <div className="flex gap-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(client);
            }}
            data-testid={`button-edit-client-${client.id}`}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(client);
            }}
            data-testid={`button-delete-client-${client.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  status: typeof CLIENT_STATUSES[number];
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onDrop: (clientId: number, newStatus: string) => void;
}

function KanbanColumn({ status, clients, onEdit, onDelete, onDrop }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'CLIENT',
    drop: (item: { clientId: number; currentStatus: string }) => {
      if (item.currentStatus !== status.value) {
        onDrop(item.clientId, status.value);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className="flex flex-col h-full min-w-[140px] max-w-[140px]" data-testid={`kanban-column-${status.value}`}>
      <div className={`${status.color} text-white px-2 py-2 rounded-t flex items-center justify-between gap-1`}>
        <span className="text-xs font-medium truncate">{status.label}</span>
        <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
          {clients.length}
        </span>
      </div>
      <div
        ref={drop}
        className={`flex-1 bg-gray-50 rounded-b p-2 space-y-2 overflow-y-auto ${
          isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'border border-gray-200'
        }`}
        style={{ minHeight: '400px' }}
      >
        {clients.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-4">
            Sin clientes
          </div>
        ) : (
          clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ClientsKanbanProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  onUpdateClientStatus: (clientId: number, newStatus: string) => void;
}

export function ClientsKanban({ clients, onEditClient, onDeleteClient, onUpdateClientStatus }: ClientsKanbanProps) {
  const clientsByStatus = useMemo(() => {
    const grouped: Record<string, Client[]> = {};
    CLIENT_STATUSES.forEach(status => {
      grouped[status.value] = clients.filter(c => c.status === status.value);
    });
    return grouped;
  }, [clients]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {CLIENT_STATUSES.map((status) => (
            <KanbanColumn
              key={status.value}
              status={status}
              clients={clientsByStatus[status.value] || []}
              onEdit={onEditClient}
              onDelete={onDeleteClient}
              onDrop={onUpdateClientStatus}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
}
