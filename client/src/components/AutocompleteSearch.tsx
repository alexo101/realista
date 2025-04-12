import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: number;
  name: string | null;
  surname: string | null;
  email: string;
  avatar: string | null;
  agencyName?: string | null;
  description?: string | null;
}

interface AutocompleteSearchProps {
  type: 'agents' | 'agencies';
  placeholder?: string;
  onSelect?: (result: SearchResult) => void;
}

export function AutocompleteSearch({ type, placeholder, onSelect }: AutocompleteSearchProps) {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Consulta para buscar agentes o agencias basado en el término de búsqueda
  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: [`/api/search/${type}`, searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      
      const params = new URLSearchParams();
      if (type === 'agencies') {
        params.append('agencyName', searchTerm.trim());
      } else {
        params.append('agentName', searchTerm.trim());
      }
      params.append('showAll', 'true');
      
      const response = await fetch(`/api/search/${type}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch search results');
      return response.json();
    },
    enabled: !!searchTerm.trim(),
    staleTime: 5000, // Caché para 5 segundos para evitar muchas peticiones
  });

  // Cerrar el menú desplegable si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Manejar eventos de teclado para navegación
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleResultClick(results[highlightedIndex]);
        } else {
          // Si no hay resultado resaltado, ir a la página de búsqueda
          const params = new URLSearchParams();
          if (type === 'agencies') {
            params.append('agencyName', searchTerm.trim());
          } else {
            params.append('agentName', searchTerm.trim());
          }
          params.append('showAll', 'true');
          window.location.href = `/search/${type}?${params}`;
        }
        setShowResults(false);
        break;
      case 'Escape':
        setShowResults(false);
        break;
    }
  };

  // Scroll hacia el resultado resaltado
  useEffect(() => {
    if (resultsRef.current && highlightedIndex >= 0) {
      const highlightedElement = resultsRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ 
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setHighlightedIndex(-1);
    setShowResults(value.trim().length > 0);
  };

  const handleResultClick = (result: SearchResult) => {
    // Actualizar el término de búsqueda según el tipo de resultado
    if (type === 'agencies') {
      setSearchTerm(result.agencyName || '');
    } else {
      setSearchTerm(`${result.name || ''} ${result.surname || ''}`);
    }
    
    setShowResults(false);
    
    if (onSelect) {
      onSelect(result);
    } else {
      // Navegar a la página detallada del agente o agencia
      const targetPath = type === 'agencies' ? `/agency/${result.id}` : `/agent/${result.id}`;
      console.log('Redirecting to', targetPath);
      window.location.href = targetPath;
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleChange}
          onFocus={() => setShowResults(searchTerm.trim().length > 0)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Buscar ${type === 'agencies' ? 'agencias' : 'agentes'}...`}
          className="pr-16"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
          {searchTerm && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={clearSearch}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => {
              if (searchTerm.trim()) {
                const params = new URLSearchParams();
                if (type === 'agencies') {
                  params.append('agencyName', searchTerm.trim());
                } else {
                  params.append('agentName', searchTerm.trim());
                }
                params.append('showAll', 'true');
                window.location.href = `/search/${type}?${params}`;
              }
            }}
            type="button"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showResults && (
        <div 
          className="absolute z-50 mt-1 w-full max-h-80 overflow-auto bg-white border rounded-md shadow-lg" 
          ref={resultsRef}
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No se encontraron resultados</div>
          ) : (
            results.map((result, index) => (
              <div
                key={result.id}
                className={cn(
                  "flex items-center p-3 cursor-pointer hover:bg-gray-100",
                  highlightedIndex === index && "bg-gray-100"
                )}
                onClick={() => handleResultClick(result)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <Avatar className="h-10 w-10 mr-3">
                  {result.avatar ? (
                    <img 
                      src={result.avatar} 
                      alt={`${result.name || ''} ${result.surname || ''}`} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-600">
                      {(result.name?.[0] || '') + (result.surname?.[0] || '')}
                    </div>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">
                    {type === 'agents' 
                      ? `${result.name || ''} ${result.surname || ''}` 
                      : result.agencyName || ''}
                  </div>
                  {type === 'agents' && result.agencyName && (
                    <div className="text-sm text-gray-500">{result.agencyName}</div>
                  )}
                  {type === 'agencies' && result.description && (
                    <div className="text-sm text-gray-500">{result.description}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}