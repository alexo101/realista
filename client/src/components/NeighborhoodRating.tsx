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
import { BARCELONA_NEIGHBORHOODS, BARCELONA_DISTRICTS_AND_NEIGHBORHOODS } from "@/utils/neighborhoods";
import { NeighborhoodSelector } from "./NeighborhoodSelector";

const formSchema = z.object({
  security: z.number().min(1).max(10),
  parking: z.number().min(1).max(10),
  familyFriendly: z.number().min(1).max(10),
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
      security: 5,
      parking: 5,
      familyFriendly: 5,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!selectedNeighborhoods.length || !user) return;

    try {
      setIsSubmitting(true);
      const response = await apiRequest("POST", "/api/neighborhoods/ratings", {
        ...data,
        neighborhood: selectedNeighborhoods[0],
        userId: user.id,
      });

      if (response.ok) {
        toast({
          title: "Valoración enviada",
          description: "Gracias por valorar el barrio.",
          duration: 3000,
        });
        form.reset();
        setSelectedNeighborhoods([]);
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
  };

  return (
    <div className="space-y-6">
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