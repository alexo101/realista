import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { Home, User, Mail, Lock, Phone, Eye, EyeOff } from "lucide-react";

type Translate = (key: string, options?: Record<string, string | number>) => string;

const createFormSchema = (t: Translate) =>
  z.object({
    name: z.string().min(2, t("auth.validation.name")),
    email: z.string()
      .min(1, t("auth.validation.emailRequired"))
      .regex(
        /^[a-zA-Z0-9._%+-ñÑáéíóúÁÉÍÓÚüÜ]+@[a-zA-Z0-9.-ñÑáéíóúÁÉÍÓÚüÜ]+\.[a-zA-Z]{2,}$/,
        t("auth.validation.emailInvalid"),
      ),
    phone: z.string()
      .min(9, t("auth.validation.phoneLength"))
      .max(9, t("auth.validation.phoneLength"))
      .regex(/^[6-9]\d{8}$/, t("auth.validation.phoneInvalid")),
    password: z.string().min(6, t("auth.validation.passwordMin")),
  });

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

export default function ClientRegisterPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formSchema = useMemo(() => createFormSchema(t), [t]);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Preparar los datos del cliente
      const clientData = {
        name: data.name,
        surname: "", // Campo simplificado
        email: data.email,
        phone: data.phone,
        password: data.password,
        // Datos adicionales para el registro de cliente
        propertyInterest: "", // Se puede completar más tarde
        budget: null, // Se puede completar más tarde
        notes: "Cliente registrado desde la web", // Nota para identificar el origen
      };

      const response = await apiRequest("POST", "/api/clients/register", clientData);

      if (response.ok) {
        toast({
          title: t("auth.register.successTitle"),
          description: t("auth.register.successDescription"),
          duration: 5000,
        });

        // Redirigir a la página de login después del registro exitoso (Spanish route)
        navigate("/iniciar-sesion");
      } else {
        const error = await response.json();
        toast({
          title: t("auth.register.errorTitle"),
          description: t("auth.register.errorDescription"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("auth.login.errorTitle"),
        description: t("auth.register.genericError"),
        variant: "destructive",
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {t("auth.register.title")}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("auth.register.subtitle")}
          </p>
        </div>

        <div className="flex gap-8">
          {/* Registration form */}
          <div className="w-full lg:w-1/2">
            <Card>
              <CardHeader>
                <CardTitle>{t("auth.register.personalInfo")}</CardTitle>
                <CardDescription>
                  {t("auth.register.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.register.name")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder={t("auth.register.namePlaceholder")}
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.register.email")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder={t("auth.register.emailPlaceholder")}
                                type="email"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.register.phone")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="612345678"
                                type="tel"
                                inputMode="numeric"
                                maxLength={9}
                                className="pl-10"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.register.password")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder={t("auth.register.passwordPlaceholder")}
                                type={showPassword ? "text" : "password"}
                                className="pl-10 pr-10"
                                {...field}
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <LoadingButton
                      type="submit"
                      className="w-full"
                      isLoading={isSubmitting}
                      loadingText={t("auth.register.creating")}
                      data-testid="button-submit-register"
                    >
                      {t("auth.register.submit")}
                    </LoadingButton>

                    <p className="text-center text-sm text-gray-500 mt-4">
                      {t("auth.register.existingAccount")}{" "}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/iniciar-sesion");
                        }}
                        className="text-primary hover:underline"
                      >
                        {t("auth.register.signIn")}
                      </a>
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Columna de información */}
          <div className="hidden lg:block lg:w-1/2">
            <Card className="h-full bg-primary/5">
              <CardContent className="p-8 h-full flex flex-col justify-center">
                <h2 className="text-2xl font-bold mb-4">{t("auth.register.promoTitle")}</h2>
                <div className="space-y-4 text-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p>
                      {t("auth.register.featureProperties")}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p>
                      {t("auth.register.featureProfessionals")}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p>
                      {t("auth.register.featureNotifications")}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p>
                      {t("auth.register.featureVisits")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}