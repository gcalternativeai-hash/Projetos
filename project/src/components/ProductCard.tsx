import React, { useState } from 'react';
import { Plus, AlertCircle, Star, Info, Tag, Package } from 'lucide-react';
import { Product } from '../data/products';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { dispatch } = useCart();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleAddToCart = () => {
    if (product.available) {
      dispatch({ type: 'ADD_ITEM', payload: product });
    }
  };

  const productNameColorClass =
    product.category === 'Promoção'
      ? 'text-red-600 dark:text-red-400'
      : product.category === 'Combos'
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-gray-800 dark:text-gray-100';

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl dark:bg-gray-800 dark:hover:shadow-lg ${
      !product.available ? 'opacity-60' : 'hover:scale-105'
    } dark:bg-gray-900 dark:hover:shadow-lg`}>
      <div className="relative group">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Overlay for unavailable products */}
        {!product.available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-full p-2 animate-pulse">
              <AlertCircle className="text-red-500" size={24} />
            </div>
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          R$ {product.price.toFixed(2)}
        </div>

        {/* Category Badge */}
        <div className="absolute top-2 left-2 bg-white bg-opacity-90 text-gray-700 px-2 py-1 rounded-full text-xs font-medium dark:bg-gray-900 dark:text-gray-200">
          {product.category === 'Promoção' && <Tag size={12} className="mr-1 text-red-500" />}
          {product.category === 'Combos' && <Package size={12} className="mr-1 text-blue-500" />}
          {product.category}
        </div>

        {/* Hover Info */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="text-white text-center">
            <Star className="mx-auto mb-1" size={20} />
            <span className="text-sm">Ver detalhes</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-semibold text-lg ${productNameColorClass}`}>{product.name}</h3>
          <div 
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info size={16} className="text-gray-400 hover:text-orange-500 cursor-help dark:text-gray-500 dark:hover:text-orange-400" />
            {showTooltip && (
              <div className="absolute right-0 top-6 bg-gray-800 text-white p-2 rounded-lg text-xs w-48 z-10">
                {product.available ? 'Produto disponível para pedido' : 'Produto temporariamente indisponível'}
              </div>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 dark:text-gray-300">{product.description}</p>
        
        {product.ingredients && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1 font-medium dark:text-gray-400">Ingredientes:</p>
            <div className="flex flex-wrap gap-1">
              {product.ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            product.available
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {product.available ? '✅ Disponível' : '❌ Indisponível'}
          </span>
          
          <button
            onClick={handleAddToCart}
            disabled={!product.available}
            className={`flex items-center space-x-1 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
              product.available
                ? 'bg-red-500 hover:bg-green-600 text-white hover:scale-105 shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus size={16} />
            <span className="text-sm">Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  );
}