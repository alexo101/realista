import { useState, useEffect } from "react";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";
import { Info } from "lucide-react";
import { BARCELONA_NEIGHBORHOODS, BARCELONA_DISTRICTS_AND_NEIGHBORHOODS } from "@/utils/neighborhoods";
import { NeighborhoodSelector } from "./NeighborhoodSelector";

const formSchema = z.object({
  security: z.number().min(1).max(10),
  parking: z.number().min(1).max(10),
  familyFriendly: z.number().min(1).max(10),
  publicTransport: z.number().min(1).max(10),
  greenSpaces: z.number().min(1).max(10),
  services: z.number().min(1).max(10),
});

type NeighborhoodRating = z.infer<typeof formSchema>;

export function NeighborhoodRating() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      security: 1,
      parking: 1,
      familyFriendly: 1,
      publicTransport: 1,
      greenSpaces: 1,
      services: 1,
    },
  });
  
  // Estado para saber si el usuario ha modificado al menos una valoración
  const [hasModified, setHasModified] = useState(false);

  // Comprobar si hay un barrio almacenado en localStorage al cargar el componente
  useEffect(() => {
    const storedNeighborhood = localStorage.getItem('barrio_a_valorar');
    if (storedNeighborhood) {
      // Seleccionar automáticamente el barrio guardado
      setSelectedNeighborhoods([storedNeighborhood]);
      // Limpiamos el localStorage para evitar que se seleccione automáticamente en futuras visitas
      localStorage.removeItem('barrio_a_valorar');
      
      // Hacer scroll al componente para que sea visible
      const element = document.getElementById('valorar-barrio');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }
    }
  }, []);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!selectedNeighborhoods.length || !user) return;

    try {
      setIsSubmitting(true);
      console.log("Enviando valoración para:", selectedNeighborhoods[0], "con datos:", {...data, userId: user.id});
      const response = await apiRequest("POST", "/api/neighborhoods/ratings", {
        ...data,
        neighborhood: selectedNeighborhoods[0],
        userId: user.id,
      });
      console.log("Respuesta de la API:", response);

      if (response.ok) {
        // Mostrar un mensaje de confirmación más visible y duradero
        toast({
          title: "Reseña guardada, muchas gracias por tu contribución",
          description: `Tu valoración para ${selectedNeighborhoods[0]} ha sido guardada con éxito.`,
          duration: 8000, // Mayor duración para asegurar que el usuario lo vea
          variant: "default",
          className: "bg-green-100 border-2 border-green-500 text-green-800 font-medium",
        });
        
        console.log("Valoración enviada correctamente:", response);
        
        // Invalidar la caché de la consulta de valoraciones para este barrio
        await queryClient.invalidateQueries({
          queryKey: ['/api/neighborhoods/ratings/average', { neighborhood: selectedNeighborhoods[0] }],
        });
        
        // También invalidar la consulta general de valoraciones
        await queryClient.invalidateQueries({
          queryKey: ['/api/neighborhoods/ratings'],
        });
        
        // Esperar un momento antes de restablecer el formulario
        setTimeout(() => {
          form.reset();
          setSelectedNeighborhoods([]);
        }, 1000);
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

  // Configuración para el selector de barrios (solo permite seleccionar uno)
  const handleNeighborhoodChange = (neighborhoods: string[]) => {
    // Si se intenta seleccionar más de un barrio, mantener solo el último seleccionado
    if (neighborhoods.length > 1) {
      const lastSelected = neighborhoods[neighborhoods.length - 1];
      setSelectedNeighborhoods([lastSelected]);
    } else {
      setSelectedNeighborhoods(neighborhoods);
    }
    
    // Reiniciar el estado de modificación cuando se selecciona un nuevo barrio
    setHasModified(false);
    
    // Reiniciar el formulario a sus valores por defecto
    form.reset({
      security: 1,
      parking: 1,
      familyFriendly: 1,
      publicTransport: 1,
      greenSpaces: 1,
      services: 1,
    });
  };

  // Crear un componente reutilizable para el slider con tooltip
  const RatingSlider = ({ name, label }: { name: keyof NeighborhoodRating, label: string }) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel>{label}</FormLabel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[field.value]}
                      onValueChange={([value]) => {
                        // Marcar que se ha modificado alguna valoración
                        if (value !== field.value) {
                          setHasModified(true);
                        }
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{field.value}/10</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <div id="valorar-barrio" className="space-y-6">
      <div className="flex items-center">
        <h2 className="text-2xl font-semibold flex-1">Conoce los barrios</h2>
      </div>
      
      {/* Selector de barrios utilizando el componente NeighborhoodSelector */}
      <div className="mb-4">
        <NeighborhoodSelector 
          selectedNeighborhoods={selectedNeighborhoods}
          onChange={handleNeighborhoodChange}
          title="SELECCIONA UN BARRIO PARA VALORAR"
          buttonText="Selecciona un barrio"
          singleSelection={true}
        />
      </div>

      {selectedNeighborhoods.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Valoración para: {selectedNeighborhoods[0]}</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RatingSlider name="security" label="Sensación de seguridad" />
                  <RatingSlider name="parking" label="Facilidad de aparcar" />
                  <RatingSlider name="familyFriendly" label="Amigable para peques" />
                  <RatingSlider name="publicTransport" label="Conexión con transporte público" />
                  <RatingSlider name="greenSpaces" label="Presencia de parques y espacios verdes" />
                  <RatingSlider name="services" label="Disponibilidad de servicios" />
                </div>

                <div className="w-full" style={{ maxWidth: "var(--search-bar-width, 100%)" }}>
                  {!hasModified && (
                    <p className="text-sm text-gray-500 mb-2 text-center">
                      Mueve las barras para valorar cada categoría
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!form.formState.isValid || isSubmitting || !hasModified}
                  >
                    Enviar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}