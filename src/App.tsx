import React, { useState, useMemo } from 'react';
import { CartProvider } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { Filters } from './components/Filters';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { OrderForm } from './components/OrderForm';
import { OrderTracking } from './components/OrderTracking';
import { AdminPanel } from './components/AdminPanel';
import { products } from './data/products';
import { ThemeProvider } from './contexts/ThemeContext';
import { normalizeString } from './utils/stringUtils'; // ALTERADO: Importar a função


function AdminAuth({ onAuthenticated }: { onAuthenticated: () => void }) {
  const handleAuth = () => {
    const password = prompt('Digite a senha do administrador:');
    if (password === 'pastel2025') {
      onAuthenticated();
    } else if (password !== null) {
      alert('Senha incorreta!');
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        // Wait for second K within 1 second
        let secondKPressed = false;
        const handleSecondK = (e2: KeyboardEvent) => {
          if (e2.key === 'K' && !secondKPressed) {
            secondKPressed = true;
            e2.preventDefault();
            handleAuth();
            document.removeEventListener('keydown', handleSecondK);
          }
        };
        
        document.addEventListener('keydown', handleSecondK);
        setTimeout(() => {
         // document.removeEventListener('keydown', handleSecondK);
        }, 1000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onAuthenticated]);

  return null;
}

function MainApplication() {
  const { state: adminState, dispatch: adminDispatch } = useAdmin();
  
  // Inicializa showAdmin como true se já estiver autenticado
  const [showAdmin, setShowAdmin] = useState(adminState.isAuthenticated);

  // Efeito para atualizar showAdmin se o estado de autenticação mudar
  React.useEffect(() => {
    if (adminState.isAuthenticated) {
      setShowAdmin(true);
    }
  }, [adminState.isAuthenticated]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  // Use admin products if available, otherwise use default products
  const currentProducts = adminState.products.length > 0 ? adminState.products : [];
  const currentCategories = adminState.categories;

  const filteredProducts = useMemo(() => {
    
    const sortedAndFiltered = [...currentProducts] // Cria uma cópia para não modificar o array original
      .sort((a, b) => {
        // Prioridade 1: "Promoção" vem primeiro
        if (a.category === 'Promoção' && b.category !== 'Promoção') {
            return -1;
        }
        if (b.category === 'Promoção' && a.category !== 'Promoção') {
            return 1;
        }

        // Prioridade 2: "Combos" vem depois de "Promoção" mas antes de outros
        if (a.category === 'Combos' && b.category !== 'Combos' && b.category !== 'Promoção') {
            return -1;
        }
        if (b.category === 'Combos' && a.category !== 'Combos' && a.category !== 'Promoção') {
            return 1;
        }

        // Se ambos são da mesma categoria de destaque ou nenhum, ordena por 'ordem'
        return (a.ordem || 0) - (b.ordem || 0);
      })
       .filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchTerm.toLowerCase());

        // ALTERADO: Normalizar ambas as strings antes da comparação
        const matchesCategory = selectedCategory === 'Todos' || normalizeString(product.category) === normalizeString(selectedCategory);

        const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
        const matchesAvailability = !showOnlyAvailable || product.available;

        return matchesSearch && matchesCategory && matchesPrice && matchesAvailability;
      });
    return sortedAndFiltered;
  }, [searchTerm, selectedCategory, priceRange, showOnlyAvailable, currentProducts]);

  // Initialize admin products with default products if empty
  React.useEffect(() => {
    if (adminState.products.length === 0 && !adminState.loading) {
      adminDispatch({ type: 'SET_PRODUCTS', payload: products });
    }
  }, [adminState.products.length, adminState.loading, adminDispatch]);

  const handleAdminAuth = () => {
    adminDispatch({ type: 'AUTHENTICATE' });
    // setShowAdmin(true); // Já será atualizado pelo useEffect
  };

  const handleCloseAdmin = () => {
    setShowAdmin(false);
    // Não fazer logout automático ao fechar - manter sessão
    // adminDispatch({ type: 'LOGOUT' });
  };

  // O botão de teste de acesso ao admin será removido
  // const handleTestAdminAccess = () => {
  //   const password = prompt('Digite a senha do administrador:');
  //   if (password === 'pastel2025') {
  //     handleAdminAuth();
  //   } else if (password !== null) {
  //     alert('Senha incorreta!');
  //   }
  // };

  if (showAdmin && adminState.isAuthenticated) {
    return <AdminPanel onClose={handleCloseAdmin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminAuth onAuthenticated={handleAdminAuth} />
      
      {/* REMOVIDO: Test Admin Button - Fixed position bottom right */}
      {/* <button
        onClick={handleTestAdminAccess}
        className="fixed bottom-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        title="Acesso Admin (Teste)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </button> */}
      
      <CartProvider>
        <Header />
        <Cart />
        <OrderForm />
        <OrderTracking />
          
        {/* Hero Section */}
          <section className="pt-52 sm:pt-60 pb-12 bg-gradient-to-r from-red-500 to-red-600">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
            {adminState.settings.storeName}
          </h1>
          <p className="text-xl text-orange-100 mb-8">
            A essência da delícia!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-4 text-orange-100">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-orange-200 rounded-full"></span>
              <span>Entrega rápida</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-orange-200 rounded-full"></span>
              <span>Ingredientes frescos</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-orange-200 rounded-full"></span>
              <span>Feito com amor</span>
            </div>
          </div>
        </div>
      </section>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            {/* Search Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center dark:text-gray-100">
                Nosso Cardápio
              </h2>
              <div className="max-w-md mx-auto">
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              </div>
            </div>

            {/* Filters and Products */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Filters
                  categories={currentCategories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  showOnlyAvailable={showOnlyAvailable}
                  onAvailabilityChange={setShowOnlyAvailable}
                />
              </div>
              <div className="lg:col-span-3">
                <ProductGrid products={filteredProducts} />
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-gray-800 text-white py-8 mt-12 dark:bg-black">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{adminState.settings.storeName}</h3>
                  <p className="text-gray-300">
                    Tradição e sabor em cada mordida.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Contato</h3>
                  <div className="space-y-2 text-gray-300">
                    <p>
                      📱{' '}
                      <a 
                        href={`tel:${adminState.settings.storePhone.replace(/\D/g, '')}`} 
                        className="hover:text-red-400 transition-colors"
                      >
                        {adminState.settings.storePhone}
                      </a>
                    </p>
                    <p>
                      📧{' '}
                      <a 
                        href="mailto:seudelivery@gmail.com" 
                        className="hover:text-red-400 transition-colors"
                      >
                        seudelivery@gmail.com
                      </a>
                    </p>
                    <p>
                      📍{' '}
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adminState.settings.storeAddress)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-red-400 transition-colors"
                      >
                        {adminState.settings.storeAddress}
                      </a>
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Horário</h3>
                  <div className="space-y-2 text-gray-300">
                    <p>Terça à Dom: 18h às 00h</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                <p>
                  &copy; 2025{' '}
                  <a 
                    href="https://www.instagram.com/graphicodee?igsh=Z3ppN3cxNG5rZ2Iy" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-red-400 transition-colors"
                  >
                    {adminState.settings.storeName}
                  </a>
                  . Todos os direitos reservados.
                </p>
              </div>
            </div>
        </footer>
      </CartProvider>
    </div>
  );
}

function App() {
  return (
    <OrderProvider>
      <AdminProvider>
        <ThemeProvider>
          <MainApplication />
        </ThemeProvider>
      </AdminProvider>
    </OrderProvider>
  );
}

export default App;
