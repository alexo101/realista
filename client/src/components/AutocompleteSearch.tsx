import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Definición de tipos
interface SearchResult {
  id: number;
  name: string | null;
  surname: string | null;
  email: string;
  avatar: string | null;
  agencyName?: string | null;
  agencyLogo?: string | null;
  agencyDescription?: string | null;
  description?: string | null;
  isAgent?: boolean;
}

interface AutocompleteSearchProps {
  type: 'agents' | 'agencies';
  placeholder?: string;
  onSelect?: (result: SearchResult) => void;
}

export function AutocompleteSearch({ type, placeholder, onSelect }: AutocompleteSearchProps) {
  // Estado local
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  // Referencias a elementos DOM
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  
  // Consulta a la API
  const { data: results = [], isLoading, isError, error } = useQuery<SearchResult[]>({
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
      
      try {
        console.log(`Searching ${type} with query:`, searchTerm);
        const response = await fetch(`/api/search/${type}?${params}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Search error (${response.status}):`, errorText);
          throw new Error(`Failed to fetch search results: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Found ${data.length} ${type} results`);
        return data;
      } catch (error) {
        console.error('Search error:', error);
        throw error;
      }
    },
    enabled: searchTerm.trim().length > 1,
    staleTime: 5000,
    retry: 1,
  });
  
  // Funciones de manejo de eventos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setHighlightedIndex(-1);
    setShowResults(value.trim().length > 0);
  };
  
  const handleClearSearch = () => {
    setSearchTerm('');
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const navigateToProfile = (result: SearchResult) => {
    if (onSelect) {
      onSelect(result);
      return;
    }
    
    try {
      // Updated paths to match the application's URL structure with explicit string types
      let targetPath = '';
      
      if (type === 'agencies') {
        targetPath = `/agencias/${result.id}`;
        console.log('Navigating to agency profile:', targetPath);
      } else {
        targetPath = `/agentes/${result.id}`;
        console.log('Navigating to agent profile:', targetPath);
      }
      
      // Force a complete page reload to ensure routing works correctly
      window.location.href = targetPath;
      
      // Add a fallback in case the primary navigation doesn't work
      setTimeout(() => {
        console.log('Fallback navigation to:', targetPath);
        window.location.replace(targetPath);
      }, 100);
    } catch (error) {
      console.error('Navigation error:', error);
      // Last resort - try direct navigation with different path format
      try {
        const fallbackPath = type === 'agencies' 
          ? `/agency-profile/${result.id}` 
          : `/agent-profile/${result.id}`;
        console.log('Attempting fallback navigation to:', fallbackPath);
        window.location.href = fallbackPath;
      } catch (secondError) {
        console.error('Fallback navigation error:', secondError);
      }
    }
  };
  
  const navigateToSearch = () => {
    if (!searchTerm.trim()) return;
    
    const params = new URLSearchParams();
    if (type === 'agencies') {
      params.append('agencyName', searchTerm.trim());
    } else {
      params.append('agentName', searchTerm.trim());
    }
    params.append('showAll', 'true');
    
    window.location.href = `/search/${type}?${params}`;
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : 0
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          navigateToProfile(results[highlightedIndex]);
        } else {
          navigateToSearch();
        }
        break;
        
      case 'Escape':
        setShowResults(false);
        break;
    }
  };
  
  // Efecto para cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Efecto para hacer scroll al elemento resaltado
  useEffect(() => {
    if (resultsContainerRef.current && highlightedIndex >= 0) {
      const container = resultsContainerRef.current;
      const highlightedItem = container.children[highlightedIndex] as HTMLElement;
      
      if (highlightedItem) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const itemTop = highlightedItem.offsetTop;
        const itemBottom = itemTop + highlightedItem.clientHeight;
        
        if (itemTop < containerTop) {
          container.scrollTop = itemTop;
        } else if (itemBottom > containerBottom) {
          container.scrollTop = itemBottom - container.clientHeight;
        }
      }
    }
  }, [highlightedIndex]);
  
  // Renderizado
  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
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
              onClick={handleClearSearch}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={navigateToSearch}
            type="button"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {showResults && (
        <div 
          className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg overflow-auto"
          style={{ maxHeight: '300px' }}
          ref={resultsContainerRef}
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Buscando...</div>
          ) : isError ? (
            <div className="p-4 text-center text-red-500">
              Error en la búsqueda. Por favor, inténtelo de nuevo.
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No se encontraron resultados</div>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                type="button"
                className={cn(
                  "w-full flex items-center p-3 text-left hover:bg-gray-100 border-b border-gray-100 last:border-0",
                  highlightedIndex === index && "bg-gray-100"
                )}
                onClick={() => navigateToProfile(result)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                  {type === 'agencies' ? (
                    result.agencyLogo ? (
                      <img 
                        src={result.agencyLogo} 
                        alt={result.agencyName || ''} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-600">
                        {(result.agencyName?.[0] || '')}
                      </div>
                    )
                  ) : result.avatar ? (
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
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {type === 'agents' 
                      ? `${result.name || ''} ${result.surname || ''}` 
                      : result.agencyName || ''}
                  </div>
                  
                  {type === 'agents' && result.agencyName && (
                    <div className="text-sm text-gray-500 truncate">{result.agencyName}</div>
                  )}
                  
                  {type === 'agencies' && (
                    <div className="text-sm text-gray-500 truncate">
                      {result.agencyDescription || result.description || 'Agencia inmobiliaria'}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}