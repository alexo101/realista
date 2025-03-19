import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  email: z.string().email("Por favor, introduce un email válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAgentRegistration?: boolean;
}

export function LoginModal({ isOpen, onClose, isAgentRegistration = false }: LoginModalProps) {
  const { toast } = useToast();
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const checkEmail = async (email: string) => {
    try {
      const response = await apiRequest("GET", `/api/users/check-email?email=${email}`);
      const data = await response.json();
      setIsExistingUser(data.exists);
      setUserName(data.name || email);
    } catch (error) {
      console.error("Error checking email:", error);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const response = await apiRequest(
        "POST",
        isExistingUser ? "/api/auth/login" : "/api/auth/register",
        {
          ...data,
          isAgent: isAgentRegistration
        }
      );

      if (response.ok) {
        toast({
          title: isExistingUser 
            ? "¡Bienvenido de nuevo!" 
            : isAgentRegistration 
              ? "¡Agencia registrada con éxito!"
              : "¡Cuenta creada con éxito!",
          duration: 3000,
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            {isAgentRegistration 
              ? "Registro de agencia inmobiliaria" 
              : "Iniciar sesión o regístrate"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="Correo electrónico" 
                      type="email"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (e.target.value) {
                          checkEmail(e.target.value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("email") && (
              <>
                {isExistingUser && (
                  <p className="text-sm text-gray-600">
                    Hola de nuevo {userName}
                  </p>
                )}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isExistingUser ? "Contraseña" : "Crea tu contraseña"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      {!isExistingUser && (
                        <p className="text-sm text-gray-600">
                          Incluye al menos 8 caracteres, mezcla números y letras
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Button type="submit" className="w-full">
              {isExistingUser ? "Iniciar sesión" : "Crear cuenta"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}