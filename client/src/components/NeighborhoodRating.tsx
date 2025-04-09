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

  // Estado para controlar la visualización del mensaje de éxito
  const [valoracionExitosa, setValoracionExitosa] = useState(false);
  const [barrioValorado, setBarrioValorado] = useState<string>("");
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!selectedNeighborhoods.length || !user) {
      toast({
        title: "Error",
        description: "Debes seleccionar un barrio y estar conectado para enviar una valoración.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Mostrar un mensaje de carga
      toast({
        title: "Enviando valoración...",
        description: "Por favor, espera un momento mientras guardamos tu valoración.",
        duration: 3000,
      });
      
      console.log("Enviando valoración para:", selectedNeighborhoods[0], "con datos:", {...data, userId: user.id});
      
      const response = await fetch("/api/neighborhoods/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          neighborhood: selectedNeighborhoods[0],
          userId: user.id,
        }),
      });
      
      console.log("Respuesta de la API (status):", response.status);
      
      const responseData = await response.json();
      console.log("Respuesta de la API (datos):", responseData);

      if (response.ok) {
        // Guardar el barrio valorado para mostrarlo en el mensaje de éxito
        setBarrioValorado(selectedNeighborhoods[0]);
        
        // Activar el estado de valoración exitosa
        setValoracionExitosa(true);
        
        // Mostrar un mensaje de confirmación más visible y duradero
        toast({
          title: "¡Valoración guardada con éxito!",
          description: `Tu valoración para ${selectedNeighborhoods[0]} ha sido registrada correctamente.`,
          duration: 8000,
          variant: "default",
          className: "bg-green-100 border-2 border-green-500 text-green-800 font-medium",
        });
        
        console.log("Valoración enviada correctamente:", responseData);
        
        // Invalidar las cachés de consultas relacionadas
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['/api/neighborhoods/ratings/average', { neighborhood: selectedNeighborhoods[0] }],
          }),
          queryClient.invalidateQueries({
            queryKey: ['/api/neighborhoods/ratings'],
          })
        ]);
        
        // Esperar un momento antes de restablecer el formulario (mantenemos la pantalla de éxito visible)
        setTimeout(() => {
          form.reset();
          
          // No resetear el barrio seleccionado inmediatamente para que se vea el mensaje de éxito
          setTimeout(() => {
            setValoracionExitosa(false);
            setSelectedNeighborhoods([]);
          }, 4000);
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: responseData.message || "Ha ocurrido un error al enviar la valoración.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al enviar valoración:", error);
      toast({
        title: "Error de comunicación",
        description: "Ha ocurrido un error al enviar la valoración. Por favor, intenta nuevamente.",
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

      {/* Mensaje de confirmación cuando la valoración ha sido enviada exitosamente */}
      {valoracionExitosa && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-800">¡Gracias por tu valoración!</h3>
              <p className="text-green-700">
                Tu opinión sobre <span className="font-bold">{barrioValorado}</span> ha sido registrada con éxito.
              </p>
              <p className="text-green-700 text-sm mt-2">
                Estas valoraciones ayudan a otras personas a conocer mejor los barrios de Barcelona.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de valoración - solo visible si no se está mostrando el mensaje de éxito */}
      {selectedNeighborhoods.length > 0 && !valoracionExitosa && (
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
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </div>
                    ) : "Enviar valoración"}
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