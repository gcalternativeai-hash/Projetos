import React, { useState } from 'react';
import { Plus, Edit, Copy, Trash2, Eye, EyeOff, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { Product } from '../data/products';
import { ProductForm } from './ProductForm';
import { atualizarOrdemProdutos } from '../lib/supabase';
import { Toast } from './Toast';
import { v4 as uuidv4 } from 'uuid';

export function ProductManager() {
  const { state, dispatch, createProduct, updateProduct, deleteProduct } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Ordenar produtos por campo ordem
  const sortedProducts = [...state.products].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  
  const filteredProducts = sortedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleMoveUp = async (product: Product, index: number) => {
    if (index === 0 || isReordering) return;
    
    setIsReordering(true);
    
    const currentProduct = filteredProducts[index];
    const previousProduct = filteredProducts[index - 1];
    
    // Verificar se os produtos têm IDs válidos
    if (!currentProduct.id || !previousProduct.id) {
      setToast({ message: 'Erro: Produtos sem ID válido', type: 'error' });
      setIsReordering(false);
      return;
    }

    // Trocar valores de ordem
    const tempOrdem = currentProduct.ordem || index + 1;
    const newCurrentOrdem = previousProduct.ordem || index;
    const newPreviousOrdem = tempOrdem;
    
    try {
      // Atualizar no Supabase
      const result = await atualizarOrdemProdutos(
        { id: currentProduct.id, ordem: newCurrentOrdem },
        { id: previousProduct.id, ordem: newPreviousOrdem }
      );
      
      if (result.success) {
        // Atualizar estado local
        const updatedProducts = state.products.map(p => {
          if (p.id === currentProduct.id) return { ...p, ordem: newCurrentOrdem };
          if (p.id === previousProduct.id) return { ...p, ordem: newPreviousOrdem };
          return p;
        });
        
        dispatch({ type: 'REORDER_PRODUCTS', payload: updatedProducts });
        setToast({ message: 'Produto movido para cima com sucesso!', type: 'success' });
      } else {
        setToast({ message: result.message, type: 'error' });
      }
    } catch (error) {
      console.error('Erro ao mover produto para cima:', error);
      setToast({ message: 'Erro inesperado ao reordenar produto', type: 'error' });
    } finally {
      setIsReordering(false);
    }
  };
  
  const handleMoveDown = async (product: Product, index: number) => {
    if (index === filteredProducts.length - 1 || isReordering) return;
    
    setIsReordering(true);
    
    const currentProduct = filteredProducts[index];
    const nextProduct = filteredProducts[index + 1];
    
    // Verificar se os produtos têm IDs válidos
    if (!currentProduct.id || !nextProduct.id) {
      setToast({ message: 'Erro: Produtos sem ID válido', type: 'error' });
      setIsReordering(false);
      return;
    }

    // Trocar valores de ordem
    const tempOrdem = currentProduct.ordem || index + 1;
    const newCurrentOrdem = nextProduct.ordem || index + 2;
    const newNextOrdem = tempOrdem;
    
    try {
      // Atualizar no Supabase
      const result = await atualizarOrdemProdutos(
        { id: currentProduct.id, ordem: newCurrentOrdem },
        { id: nextProduct.id, ordem: newNextOrdem }
      );
      
      if (result.success) {
        // Atualizar estado local
        const updatedProducts = state.products.map(p => {
          if (p.id === currentProduct.id) return { ...p, ordem: newCurrentOrdem };
          if (p.id === nextProduct.id) return { ...p, ordem: newNextOrdem };
          return p;
        });
        
        dispatch({ type: 'REORDER_PRODUCTS', payload: updatedProducts });
        setToast({ message: 'Produto movido para baixo com sucesso!', type: 'success' });
      } else {
        setToast({ message: result.message, type: 'error' });
      }
    } catch (error) {
      console.error('Erro ao mover produto para baixo:', error);
      setToast({ message: 'Erro inesperado ao reordenar produto', type: 'error' });
    } finally {
      setIsReordering(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDuplicate = async (product: Product) => {
    const duplicatedProductData: Omit<Product, 'id'> = {
      ...product,
      name: `${product.name} (Cópia)`,
      ordem: Math.max(...state.products.map(p => p.ordem || 0), 0) + 1
    };
    
    const success = await createProduct(duplicatedProductData);
    if (success) {
      setToast({ message: 'Produto duplicado com sucesso!', type: 'success' });
    } else {
      setToast({ message: 'Erro ao duplicar produto', type: 'error' });
    }
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Tem certeza que deseja excluir "${product.name}"?`)) {
      const success = await deleteProduct(product.id);
      if (success) {
        setToast({ message: 'Produto excluído com sucesso!', type: 'success' });
      } else {
        setToast({ message: 'Erro ao excluir produto', type: 'error' });
      }
    }
  };

  const toggleAvailability = async (product: Product) => {
    const success = await updateProduct(product.id, { available: !product.available });
    if (success) {
      setToast({ 
        message: `Produto ${!product.available ? 'ativado' : 'desativado'} com sucesso!`, 
        type: 'success' 
      });
    } else {
      setToast({ message: 'Erro ao alterar disponibilidade', type: 'error' });
    }
  };

  const handleFormSubmit = async (productData: Omit<Product, 'id'>) => {
    let success = false;
    
    if (editingProduct) {
      success = await updateProduct(editingProduct.id, productData);
      if (success) {
        setToast({ message: 'Produto atualizado com sucesso!', type: 'success' });
      } else {
        setToast({ message: 'Erro ao atualizar produto', type: 'error' });
      }
    } else {
      success = await createProduct(productData);
      if (success) {
        setToast({ message: 'Produto criado com sucesso!', type: 'success' });
      } else {
        setToast({ message: 'Erro ao criar produto', type: 'error' });
      }
    }
    
    if (success) {
      setShowForm(false);
      setEditingProduct(null);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        categories={state.categories.filter(cat => cat !== 'Todos')}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-800">Gerenciar Produtos</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={18} />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {state.categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          Mostrando {filteredProducts.length} de {state.products.length} produtos
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {state.loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Carregando produtos...</p>
          </div>
        )}
        
        {state.error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">Erro: {state.error}</p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        #{product.ordem || index + 1}
                      </span>
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleMoveUp(product, index)}
                          disabled={index === 0 || isReordering}
                          className={`p-1 rounded transition-colors ${
                            index === 0 || isReordering
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                          }`}
                          title="Mover para cima"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveDown(product, index)}
                          disabled={index === filteredProducts.length - 1 || isReordering}
                          className={`p-1 rounded transition-colors ${
                            index === filteredProducts.length - 1 || isReordering
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                          }`}
                          title="Mover para baixo"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg mr-4"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    R$ {product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleAvailability(product)}
                      className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                        product.available
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {product.available ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{product.available ? 'Disponível' : 'Indisponível'}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(product)}
                        className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                        title="Duplicar"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum produto encontrado</p>
          </div>
        )}
      </div>
      
      {/* Loading Overlay */}
      {isReordering && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-700 mt-2">Reordenando produtos...</p>
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}