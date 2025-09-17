// src/components/CategoryManager.tsx
import React, { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical, Check, X } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { normalizeString } from '../utils/stringUtils'; // ALTERADO: Importar do novo arquivo

export function CategoryManager() {
  const { state, dispatch } = useAdmin();
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const categoriesWithoutTodos = state.categories.filter(cat => cat !== 'Todos');

  const handleAddCategory = () => {
    if (newCategory.trim() && !state.categories.includes(newCategory.trim())) {
      dispatch({ type: 'ADD_CATEGORY', payload: newCategory.trim() });
      dispatch({
        type: 'ADD_TO_HISTORY',
        payload: { action: 'Categoria criada', data: newCategory.trim() }
      });
      setNewCategory('');
    }
  };

  const handleEditCategory = (oldName: string) => {
    setEditingCategory(oldName);
    setEditValue(oldName);
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue.trim() !== editingCategory && !state.categories.includes(editValue.trim())) {
      dispatch({
        type: 'UPDATE_CATEGORY',
        payload: { oldName: editingCategory!, newName: editValue.trim() }
      });
      dispatch({
        type: 'ADD_TO_HISTORY',
        payload: { action: 'Categoria editada', data: { old: editingCategory, new: editValue.trim() } }
      });
    }
    setEditingCategory(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  const handleDeleteCategory = (category: string) => {
    const productsInCategory = state.products.filter(p => p.category === category);
    
    if (productsInCategory.length > 0) {
      alert(`Não é possível excluir a categoria "${category}" pois ela contém ${productsInCategory.length} produto(s).`);
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir a categoria "${category}"?`)) {
      dispatch({ type: 'DELETE_CATEGORY', payload: category });
      dispatch({
        type: 'ADD_TO_HISTORY',
        payload: { action: 'Categoria excluída', data: category }
      });
    }
  };

  // Função auxiliar para normalizar strings (remover acentos e converter para minúsculas)
  // const normalizeString = (str: string) => {
    //return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  // };

  const getCategoryProductCount = (category: string) => {
    const normalizedCategory = normalizeString(category);
    return state.products.filter(product => 
      normalizeString(product.category) === normalizedCategory
    ).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gerenciar Categorias</h2>
      </div>

      {/* Add New Category */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Adicionar Nova Categoria</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Nome da categoria"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCategory.trim() || state.categories.includes(newCategory.trim())}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={18} />
            <span>Adicionar</span>
          </button>
        </div>
        {newCategory.trim() && state.categories.includes(newCategory.trim()) && (
          <p className="text-red-500 text-sm mt-2">Esta categoria já existe</p>
        )}
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Categorias Existentes</h3>
          <p className="text-sm text-gray-600 mt-1">
            Arraste para reordenar • {categoriesWithoutTodos.length} categorias
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {categoriesWithoutTodos.map((category, index) => {
            const productCount = getCategoryProductCount(category);
            const isEditing = editingCategory === category;

            return (
              <div
                key={category}
                className="px-6 py-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors"
              >
                <div className="cursor-move text-gray-400 hover:text-gray-600">
                  <GripVertical size={18} />
                </div>

                <div className="flex-1">
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="text-green-600 hover:text-green-800 p-1"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-gray-900">{category}</div>
                      <div className="text-sm text-gray-500">
                        {productCount} produto{productCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                    #{index + 1}
                  </span>
                  
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                        title="Editar categoria"
                      >
                        <Edit size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        disabled={productCount > 0}
                        className={`p-1 rounded transition-colors ${
                          productCount > 0
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                        }`}
                        title={productCount > 0 ? 'Não é possível excluir categoria com produtos' : 'Excluir categoria'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {categoriesWithoutTodos.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">Nenhuma categoria criada ainda</p>
            <p className="text-gray-400 text-sm mt-1">Adicione sua primeira categoria acima</p>
          </div>
        )}
      </div>

      {/* Category Usage Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Estatísticas de Uso</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesWithoutTodos.map(category => {
            const count = getCategoryProductCount(category);
            const percentage = state.products.length > 0 ? (count / state.products.length) * 100 : 0;
            
            return (
              <div key={category} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{category}</span>
                  <span className="text-sm text-gray-600">{count} produtos</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {percentage.toFixed(1)}% do total
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
