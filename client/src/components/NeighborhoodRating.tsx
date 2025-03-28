import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import { Info } from "lucide-react";

// Base de datos simplificada de provincias, municipios y barrios de España
const SPAIN_LOCATIONS = [
  // Provincias
  "Barcelona", "Madrid", "Valencia", "Sevilla", "Bilbao", "Málaga", "Alicante", "Murcia", "Zaragoza", "Granada", 
  
  // Municipios de Barcelona
  "Barcelona (ciudad)", "Badalona", "Hospitalet de Llobregat", "Terrassa", "Sabadell", "Mataró", "Santa Coloma de Gramenet",
  
  // Municipios de Madrid
  "Madrid (ciudad)", "Móstoles", "Alcalá de Henares", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón",
  
  // Barrios de Barcelona
  "Barceloneta", "Born", "Eixample", "El Raval", "Gràcia", "Les Corts", "Poble Sec", "Poblenou",
  "Sagrada Familia", "Sant Andreu", "Sant Antoni", "Sant Martí", "Sants", "Sarrià-Sant Gervasi",
  
  // Barrios de Madrid
  "Sol", "Salamanca", "Chamberí", "Retiro", "Chamartín", "Moncloa", "Tetuán", "Arganzuela",
  "Carabanchel", "Usera", "Latina", "Moratalaz", "Hortaleza", "Villaverde",
  
  // Barrios de Valencia
  "Ciutat Vella", "Eixample (Valencia)", "Extramurs", "Campanar", "La Saïdia", "El Pla del Real",
  "L'Olivereta", "Patraix", "Jesús", "Quatre Carreres", "Poblats Marítims", "Camins al Grau"
];

const formSchema = z.object({
  security: z.number().min(1).max(10),
  parking: z.number().min(1).max(10),
  familyFriendly: z.number().min(1).max(10),
});

type NeighborhoodRating = z.infer<typeof formSchema>;

export function NeighborhoodRating() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      security: 0,
      parking: 0,
      familyFriendly: 0,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!selectedNeighborhood || !user) return;

    try {
      setIsSubmitting(true);
      const response = await apiRequest("POST", "/api/neighborhoods/ratings", {
        ...data,
        neighborhood: selectedNeighborhood,
        userId: user.id,
      });

      if (response.ok) {
        toast({
          title: "Valoración enviada",
          description: "Gracias por valorar el barrio.",
          duration: 3000,
        });
        form.reset();
        setSelectedNeighborhood(null);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Ha ocurrido un error al enviar la valoración.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al enviar la valoración.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  
  // Filtramos las ubicaciones según el término de búsqueda
  const filteredLocations = searchQuery 
    ? SPAIN_LOCATIONS.filter(n => 
        n.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SPAIN_LOCATIONS;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h2 className="text-2xl font-semibold flex-1">Conoce los barrios</h2>
      </div>
      
      <div className="w-full">
        <div className="relative mb-4">
          <input 
            type="text"
            className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Busca tu barrio, municipio ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery("")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="w-full">
        <select
          className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          value={selectedNeighborhood || ""}
          onChange={(e) => setSelectedNeighborhood(e.target.value)}
        >
          <option value="">Selecciona una ubicación</option>
          {filteredLocations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
        {filteredLocations.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No se encontraron resultados para "{searchQuery}"
          </div>
        )}
      </div>

      {selectedNeighborhood && (
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="security"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Seguridad</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FormControl>
                                <Slider
                                  min={1}
                                  max={10}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={([value]) => field.onChange(value)}
                                />
                              </FormControl>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Valor: {field.value}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parking"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Fácil de aparcar</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FormControl>
                                <Slider
                                  min={1}
                                  max={10}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={([value]) => field.onChange(value)}
                                />
                              </FormControl>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Valor: {field.value}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="familyFriendly"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Amigable para niños</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FormControl>
                                <Slider
                                  min={1}
                                  max={10}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={([value]) => field.onChange(value)}
                                />
                              </FormControl>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Valor: {field.value}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!form.formState.isValid || isSubmitting}
                >
                  Enviar
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}