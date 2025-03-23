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

const BARCELONA_NEIGHBORHOODS = [
  "Barceloneta",
  "Born",
  "Eixample",
  "El Raval",
  "Gràcia",
  "Les Corts",
  "Poble Sec",
  "Poblenou",
  "Sagrada Familia",
  "Sant Andreu",
  "Sant Antoni",
  "Sant Martí",
  "Sants",
  "Sarrià-Sant Gervasi"
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

  return (
    <div className="space-y-6">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="flex-1 text-left">
            <h2 className="text-2xl font-semibold">Conoce los barrios</h2>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Tu grano de arena para ayudar a quienes no conocen los barrios</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {BARCELONA_NEIGHBORHOODS.map((neighborhood) => (
          <Button
            key={neighborhood}
            variant={selectedNeighborhood === neighborhood ? "default" : "outline"}
            className="w-full text-sm py-1"
            onClick={() => setSelectedNeighborhood(neighborhood)}
          >
            {neighborhood}
          </Button>
        ))}
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