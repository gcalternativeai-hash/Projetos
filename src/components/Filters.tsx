import React from 'react';
import { Filter, ChevronDown, DollarSign, CheckCircle } from 'lucide-react';

interface FiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  showOnlyAvailable: boolean;
  onAvailabilityChange: (available: boolean) => void;
}

export function Filters({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  showOnlyAvailable,
  onAvailabilityChange
}: FiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6 sticky top-24 dark:bg-gray-900">
      <div className="flex items-center space-x-2 mb-4">
        <Filter size={20} className="text-red-500" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Filtros</h3>
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 dark:text-gray-200">
            📂 Categoria
          </label>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-red-900 dark:hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 dark:text-gray-200">
            💰 Faixa de Preço
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>R$ {priceRange[0].toFixed(2)}</span>
              <span>R$ {priceRange[1].toFixed(2)}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="200"
                step="0.5"
                value={priceRange[0]}
                onChange={(e) => onPriceRangeChange([parseFloat(e.target.value), priceRange[1]])}
                className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500 dark:bg-gray-600"
              />
              <input
                type="range"
                min="0"
                max="200"
                step="0.5"
                value={priceRange[1]}
                onChange={(e) => onPriceRangeChange([priceRange[0], parseFloat(e.target.value)])}
                className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500 dark:bg-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Availability Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 dark:text-gray-200">
            ✅ Disponibilidade
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="available"
              checked={showOnlyAvailable}
              onChange={(e) => onAvailabilityChange(e.target.checked)}
              className="w-4 h-4 text-red-500 focus:ring-red-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="available" className="text-sm text-gray-700 cursor-pointer dark:text-gray-200">
              Mostrar apenas disponíveis
            </label>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-orange-50 p-3 rounded-lg dark:bg-orange-900">
          <h4 className="text-sm font-medium text-red-800 mb-2 dark:text-orange-200">📊 Resumo</h4>
          <div className="text-xs text-red-700 space-y-1 dark:text-orange-100">
            <p>• {selectedCategory === 'Todos' ? 'Todas as categorias' : `Categoria: ${selectedCategory}`}</p>
            <p>• Preço: R$ {priceRange[0].toFixed(2)} - R$ {priceRange[1].toFixed(2)}</p>
            <p>• {showOnlyAvailable ? 'Apenas disponíveis' : 'Todos os produtos'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}