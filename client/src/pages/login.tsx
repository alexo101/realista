import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
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
import { useUser } from "@/contexts/user-context";
import { useLanguage } from "@/contexts/language-context";
import { Building, Home, Lock, Mail, Eye, EyeOff } from "lucide-react";

type Translate = (key: string, options?: Record<string, string | number>) => string;

const createFormSchema = (t: Translate) =>
  z.object({
    email: z.string()
      .min(1, t("auth.validation.emailRequired"))
      .regex(
        /^[a-zA-Z0-9._%+-ñÑáéíóúÁÉÍÓÚüÜ]+@[a-zA-Z0-9.-ñÑáéíóúÁÉÍÓÚüÜ]+\.[a-zA-Z]{2,}$/,
        t("auth.validation.emailInvalid"),
      ),
    password: z.string().min(1, t("auth.validation.passwordRequired")),
  });

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

export default function LoginPage() {
  const { toast } = useToast();
  const { setUser } = useUser();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formSchema = useMemo(() => createFormSchema(t), [t]);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {      
      const userData = await apiRequest("POST", "/api/auth/login", data);
      
      // Update user context FIRST so destination route has access to it
      setUser(userData);
      if (userData?.csrfToken) {
        localStorage.setItem("csrfToken", userData.csrfToken);
      }
      
      // CRITICAL: Use setTimeout to defer navigation until next event loop tick
      // This ensures React finishes batching the setUser() state update before navigate() runs.
      // Without this, ManagePage's auth guard would see undefined user and redirect back to login.
      setTimeout(() => {
        if (userData.agentType === "super_admin") {
          navigate("/super-admin");
          toast({
            title: t("auth.login.superAdminAccess"),
            duration: 3000,
          });
          return;
        }

        // For agents, always redirect to their calendar dashboard
        if (!userData.isClient && userData.agentUuid) {
          sessionStorage.removeItem('pendingSavedSearch');
          navigate(`/gestionar/${userData.agentUuid}/calendario`);
        } else {
          // For clients, check if there's a pending saved search
          const pendingSavedSearch = sessionStorage.getItem('pendingSavedSearch');
          if (pendingSavedSearch) {
            const searchData = JSON.parse(pendingSavedSearch);
            navigate(searchData.returnUrl || "/perfil-cliente");
          } else {
            navigate("/perfil-cliente");
          }
        }
        
        // Show toast after navigation
        toast({
          title: t("auth.login.welcomeBack"),
          duration: 3000,
        });
      }, 0);
    } catch (error: any) {
      toast({
        title: t("auth.login.errorTitle"),
        description: t("auth.login.errorDescription"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto pt-24 pb-12">
      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
        <div className="lg:w-1/2 bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-6">{t("auth.login.title")}</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.login.email")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder={t("auth.login.emailPlaceholder")}
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.login.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder={t("auth.login.passwordPlaceholder")}
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

              <div className="-mt-3 text-right">
                <Link
                  href="/recuperar-contrasena"
                  className="text-sm text-primary hover:underline"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>

              <LoadingButton
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                loadingText={t("auth.login.processing")}
                data-testid="button-submit-login"
              >
                {t("auth.login.submit")}
              </LoadingButton>

              <div className="space-y-2 mt-4">
                <p className="text-center text-sm text-gray-500">
                  {t("auth.login.professionalPrompt")}{" "}
                  <a
                    href="/realista-pro"
                    className="text-primary hover:underline"
                  >
                    {t("auth.login.professionalLink")}
                  </a>
                </p>
                <p className="text-center text-sm text-gray-500">
                  {t("auth.login.clientPrompt")}{" "}
                  <a
                    href="/client-register"
                    className="text-primary hover:underline"
                  >
                    {t("auth.login.clientLink")}
                  </a>
                </p>
              </div>
            </form>
          </Form>
        </div>

        <div className="lg:w-1/2 bg-primary/5 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">{t("auth.login.promoTitle")}</h2>
          <p className="mb-6 text-gray-700">
            {t("auth.login.promoDescription")}
          </p>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t("auth.login.propertyFeatureTitle")}</h3>
                <p className="text-sm text-gray-600">
                  {t("auth.login.propertyFeatureDescription")}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{t("auth.login.professionalFeatureTitle")}</h3>
                <p className="text-sm text-gray-600">
                  {t("auth.login.professionalFeatureDescription")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}