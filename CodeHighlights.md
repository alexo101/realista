# Aspectos destacados del código

## Selector de tipo de perfil
```tsx
<FormField
  control={form.control}
  name="profileType"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Tipo de perfil</FormLabel>
      <Select
        onValueChange={field.onChange}
        defaultValue={field.value}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo de perfil" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="agent" className="flex items-center">
            <div className="flex items-center">
              <UserIcon className="mr-2 h-4 w-4" />
              Anunciarme como agente
            </div>
          </SelectItem>
          <SelectItem value="agency" className="flex items-center">
            <div className="flex items-center">
              <Building className="mr-2 h-4 w-4" />
              Anunciar mi agencia
            </div>
          </SelectItem>
          <SelectItem value="agencyNetwork" className="flex items-center">
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Añadir red de agencias
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Lógica para determinar el tipo de usuario
```tsx
// Determinar si el usuario será un agente admin basado en la selección
const isAdmin = data.profileType === "agency" || data.profileType === "agencyNetwork";
const isAgencyNetwork = data.profileType === "agencyNetwork";

// Preparamos el payload según el tipo de perfil seleccionado
const payload = {
  email: data.email,
  password: data.password,
  isAgent: true, // Todos los usuarios son agentes en la base de datos
  isAdmin: isAdmin, // Para agencias y redes de agencias
  // Para redes de agencias, podemos añadir propiedades adicionales en el futuro
};
```

## Redirección inteligente basada en el tipo de usuario
```tsx
// Redirigir a la página de gestión con la pestaña adecuada según el tipo de perfil
if (isAdmin) {
  // Si es una agencia o red de agencias, dirigir a la sección de perfil de agencia
  navigate("/manage?tab=agency-profile");
} else {
  // Si es un agente, dirigir a la sección de perfil de agente
  navigate("/manage");
}
```

## Navegación a páginas dedicadas (en lugar de modales)
```tsx
// Antes (usando modal)
<Button
  variant="outline"
  onClick={() => openLogin(true)}
>
  Registra tu agencia
</Button>

// Ahora (usando páginas dedicadas)
<Link href="/register">
  <Button variant="outline">
    Registra tu agencia
  </Button>
</Link>
```

## Detección de URL params para iniciar en la sección correcta
```tsx
// Obtener el parámetro 'tab' de la URL si existe
const getInitialSection = () => {
  const params = new URLSearchParams(location.split('?')[1]);
  const tabParam = params.get('tab');
  
  // Si es un administrador de agencia y hay un parámetro tab=agency-profile, 
  // o si es un administrador y no hay perfil de agente
  if ((user?.isAdmin && tabParam === 'agency-profile') || 
      (user?.isAdmin && !user?.name)) {
    return 'agency-profile';
  }
  
  // Validar que el tab sea uno de los valores permitidos
  const validTabs = ['agent-profile', 'agency-profile', 'properties', 'clients', 'inquiries', 'appointments'];
  return validTabs.includes(tabParam || '') ? tabParam : 'agent-profile';
};
```