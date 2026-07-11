import { useMemo } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Mail, Phone } from "lucide-react";
import { type Client } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";
import { getClientStatuses } from "@/utils/clientStatuses";

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
}

function ClientCard({ client, onEdit }: ClientCardProps) {
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
        <div 
          className="font-medium text-sm text-primary hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(client);
          }}
          data-testid={`link-client-name-${client.id}`}
        >
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
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  status: ReturnType<typeof getClientStatuses>[number];
  clients: Client[];
  onEdit: (client: Client) => void;
  onDrop: (clientId: number, newStatus: string) => void;
  emptyLabel: string;
}

function KanbanColumn({ status, clients, onEdit, onDrop, emptyLabel }: KanbanColumnProps) {
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
    <div className="flex flex-col h-full min-w-[220px] max-w-[220px]" data-testid={`kanban-column-${status.value}`}>
      <div className={`${status.color} px-3 py-2 rounded-t flex items-center justify-between gap-2`}>
        <span className="text-sm font-medium truncate">{status.label}</span>
        <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
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
            {emptyLabel}
          </div>
        ) : (
          clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={onEdit}
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
  onUpdateClientStatus: (clientId: number, newStatus: string) => void;
}

export function ClientsKanban({ clients, onEditClient, onUpdateClientStatus }: ClientsKanbanProps) {
  const { t } = useLanguage();
  const clientStatuses = getClientStatuses(t);

  const clientsByStatus = useMemo(() => {
    const grouped: Record<string, Client[]> = {};
    clientStatuses.forEach(status => {
      grouped[status.value] = clients.filter(c => c.status === status.value);
    });
    return grouped;
  }, [clients, clientStatuses]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {clientStatuses.map((status) => (
            <KanbanColumn
              key={status.value}
              status={status}
              clients={clientsByStatus[status.value] || []}
              onEdit={onEditClient}
              onDrop={onUpdateClientStatus}
              emptyLabel={t("manage.clients.empty_kanban")}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
}
