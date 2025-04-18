import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Search, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface Agency {
  id: number;
  name: string;
  email: string;
}

interface AgencyReviewProps {
  onClose: () => void;
}

const formSchema = z.object({
  agencyEmail: z.string().email("Introduce un email válido"),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, "El comentario es obligatorio"),
});

export function AgencyReview({ onClose }: AgencyReviewProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agencyEmail: "",
      rating: 0,
      comment: "",
    },
  });

  const searchAgencies = async () => {
    if (!searchTerm) {
      toast({
        title: "Error",
        description: "Introduce un nombre o email para buscar agencias",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSearching(true);
      
      const params = new URLSearchParams();
      params.append('agencyName', searchTerm);
      params.append('showAll', 'true');
      
      const response = await fetch(`/api/search/agencies?${params}`);
      if (!response.ok) {
        throw new Error("Error al buscar agencias");
      }
      
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al buscar agencias",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
    }

    setIsSearching(true);
    try {
      // Usar la API real para buscar agencias
      const response = await fetch(`/api/search/agencies?agencyName=${encodeURIComponent(searchTerm)}&showAll=true`);
      if (!response.ok) {
        throw new Error('Error al buscar agencias');
      }
      const data = await response.json();
      // Mapear los resultados para asegurar que tienen la estructura esperada
      const formattedResults = data.map(agency => ({
        id: agency.id,
        name: agency.agencyName || agency.name,
        email: agency.email
      }));
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching agencies:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las agencias",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAgencySelect = (agency: any) => {
    setSelectedAgency(agency);
    form.setValue("agencyEmail", agency.email);
    // Limpiar resultados de búsqueda después de seleccionar
    setSearchResults([]);
    setSearchTerm("");
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!selectedAgency) {
      toast({
        title: "Error",
        description: "Selecciona una agencia para dejar una reseña",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // En una implementación real, esta sería una llamada a la API
      /* const response = await apiRequest('POST', '/api/agency-reviews', {
        agencyId: selectedAgency.id,
        rating: data.rating,
        comment: data.comment,
      }); */

      toast({
        title: "Reseña enviada",
        description: `Has dejado una reseña a ${selectedAgency.name}`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la reseña",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border shadow-md max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Reseña de agencia</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {selectedAgency ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="bg-primary/10 p-3 rounded mb-4">
                <p className="font-medium">{selectedAgency.name}</p>
                <p className="text-sm text-muted-foreground">{selectedAgency.email}</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm" 
                  onClick={() => setSelectedAgency(null)}
                >
                  Cambiar agencia
                </Button>
              </div>

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calificación</FormLabel>
                    <FormControl>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-6 w-6 cursor-pointer ${
                              star <= field.value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                            onClick={() => {
                              field.onChange(star);
                              setRating(star);
                            }}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentario</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Comparte tu experiencia con esta agencia..."
                        className="resize-none min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Enviando..." : "Enviar reseña"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="flex">
              <Input
                placeholder="Buscar agencia por nombre o email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={searchAgencies} 
                className="ml-2" 
                disabled={isSearching}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>

            {isSearching ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Buscando agencias...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Resultados de la búsqueda:</p>
                {searchResults.map((agency) => (
                  <div
                    key={agency.id}
                    onClick={() => handleAgencySelect(agency)}
                    className="p-3 rounded border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <p className="font-medium">{agency.name}</p>
                    <p className="text-sm text-muted-foreground">{agency.email}</p>
                  </div>
                ))}
              </div>
            ) : searchTerm && !isSearching ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron agencias</p>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}