import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Agent {
  id: number;
  name: string;
  email: string;
}

interface AgentReviewProps {
  onClose: () => void;
}

export function AgentReview({ onClose }: AgentReviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [hasDealt, setHasDealt] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [ratings, setRatings] = useState({
    areaKnowledge: 0,
    priceNegotiation: 0,
    treatment: 0,
    punctuality: 0,
    propertyKnowledge: 0,
  });

  const { data: agents, isError, error } = useQuery<Agent[]>({
    queryKey: ['/api/agents/search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const response = await fetch(`/api/agents/search?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        const message = `Error searching agents: ${response.status} ${response.statusText}`;
        throw new Error(message);
      }
      return response.json();
    },
    enabled: searchTerm.length > 2,
  });

  const steps = [
    "Buscar agente",
    "Verificación",
    "Conocimientos de la zona",
    "Negociación del precio",
    "Trato",
    "Puntualidad y respuesta",
    "Conocimiento de la propiedad",
  ];

  const handleRatingChange = (field: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [field]: value }));
  };

  const calculateAverageRating = () => {
    const values = Object.values(ratings);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Number((sum / values.length).toFixed(2));
  };

  const handleSubmit = async () => {
    if (!selectedAgent) return;

    try {
      const response = await fetch('/api/agent-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          rating: calculateAverageRating(),
          hasDealt,
          ...ratings,
        }),
      });

      if (response.ok) {
        onClose();
      } else {
        console.error(`Error submitting review: ${response.status} ${response.statusText}`);
        // Add error handling here, e.g., display an error message
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      // Add error handling here, e.g., display an error message
    }
  };

  const renderStars = (field: keyof typeof ratings) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-6 w-6 cursor-pointer transition-colors ${
            ratings[field] >= star ? 'fill-blue-500 text-blue-500' : 'text-gray-300'
          }`}
          onClick={() => handleRatingChange(field, star)}
        />
      ))}
    </div>
  );

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setSearchTerm(""); // Clear search after selection
  };


  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Valorar agente</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex gap-2 mb-6">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i <= step ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <Input
                placeholder="Buscar agente por nombre o email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {agents?.length ? (
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <Card
                      key={agent.id}
                      className={`cursor-pointer transition-shadow hover:shadow-md ${
                        selectedAgent?.id === agent.id ? 'border-blue-500' : ''
                      }`}
                      onClick={() => handleSelectAgent(agent)}
                    >
                      <CardContent className="p-4">
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-gray-500">{agent.email}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : searchTerm.length > 2 && !isError ? (
                <p className="text-center text-gray-500">No se encontraron agentes</p>
              ) : isError ? (
                <p className="text-center text-red-500">Error al buscar agentes: {error?.message}</p>
              ) : null}
            </div>
          )}

          {step === 1 && hasDealt === null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-center">
                  ¿Has cerrado alguna operación con el agente?
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex justify-center gap-4">
                <Button
                  variant={hasDealt === true ? "default" : "outline"}
                  onClick={() => setHasDealt(true)}
                >
                  Sí
                </Button>
                <Button
                  variant={hasDealt === false ? "default" : "outline"}
                  onClick={() => setHasDealt(false)}
                >
                  No
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 1 && hasDealt === false && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-center">
                  Puedes añadir una reseña pero no contará para la puntuación del agente
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex justify-center">
                <Button onClick={() => setStep(step + 1)}>
                  Continuar
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Conocimientos de la zona</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  ¿Conocía las características del barrio (servicios, conexión con medios de transporte, sitios de ocio, etc)?
                </p>
                {renderStars('areaKnowledge')}
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Negociación del precio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  ¿Te representó en la búsqueda de un mejor precio?
                </p>
                {renderStars('priceNegotiation')}
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Trato</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  ¿Recibiste un trato amable y cordial por parte de tu agente? ¿Escuchó tus necesidades y te dio respuestas apropiadas?
                </p>
                {renderStars('treatment')}
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Puntualidad y tiempo de respuesta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  ¿Llegó a tiempo a las citas pactadas? ¿Respondía rápidamente a tus solicitudes? ¿Se mostraba disponible dentro de horarios razonables?
                </p>
                {renderStars('punctuality')}
              </CardContent>
            </Card>
          )}

          {step === 6 && (
            <Card>
              <CardHeader>
                <CardTitle>Conocimiento de la propiedad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  ¿Tenía dominio del inmueble? ¿Fue capaz de mostrarte el potencial y "puntos débiles" de la propiedad?
                </p>
                {renderStars('propertyKnowledge')}
              </CardContent>
            </Card>
          )}

          <div className="mt-6 flex justify-end gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Anterior
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 0 && !selectedAgent) ||
                  (step === 1 && hasDealt === null) ||
                  (step > 1 && step < 6 && !ratings[Object.keys(ratings)[step - 2] as keyof typeof ratings])
                }
              >
                Siguiente
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                Enviar reseña
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}