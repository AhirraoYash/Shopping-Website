import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Product, Category, Config } from '../types';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function Catalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prods, conf] = await Promise.all([
          apiService.getCategories(),
          apiService.getProducts(),
          apiService.getConfig(),
        ]);
        setCategories(cats);
        setProducts(prods);
        setConfig(conf);
      } catch (err) {
        toast.error('Failed to load catalog data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOrderClick = (product: Product) => {
    if (!config?.ownerWhatsAppNumber) {
      toast.error('Store contact number not available.');
      return;
    }
    
    const message = `Hello Ashirvad Electrical, I am interested in:\n\nProduct: ${product.name}\nPrice: ₹${product.price}\n\nPlease let me know if this is available.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${config.ownerWhatsAppNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const getProductImages = (product: Product) => [product.imageUrl, product.imageUrl2].filter((image): image is string => Boolean(image));
  const getPrimaryProductImage = (product: Product) => getProductImages(product)[0] || null;

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-slate-100 rounded-lg p-3">
        <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Search Products</p>
        <div className="relative">
          <input
            type="text"
            placeholder="Find switches, bulbs, wires..."
            className="w-full pl-9 pr-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-sm text-slate-600 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Category Horizontal Scroll */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 hide-scrollbar">
        <button
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${
            activeCategory === 'all'
              ? 'bg-shop-yellow text-shop-gray'
              : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${
              activeCategory === cat.id
                ? 'bg-shop-yellow text-shop-gray'
                : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-[16px] p-8 text-center border border-slate-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]">
          <p className="text-slate-500 font-medium text-sm">No products found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              onClick={() => setSelectedProduct(product)}
              className="cursor-pointer bg-white rounded-[16px] overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md duration-300"
            >
              {getPrimaryProductImage(product) ? (
                <div className="h-28 sm:h-36 w-full bg-slate-200 border-b border-slate-100 flex-shrink-0">
                  <img src={getPrimaryProductImage(product) as string} alt={product.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-28 sm:h-36 w-full bg-slate-200 border-b border-slate-100 flex items-center justify-center text-slate-400 text-xs italic flex-shrink-0">
                  No Image
                </div>
              )}
              <div className="p-3 sm:p-4 flex flex-col flex-1">
                <h4 className="font-bold text-sm text-shop-gray leading-tight line-clamp-2">{product.name}</h4>
                <p className="text-xs text-slate-400 mt-1 flex-1 line-clamp-2">{product.details}</p>
                <p className="font-bold text-orange-600 text-sm mt-3">
                  ₹{product.price}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOrderClick(product);
                  }}
                  className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded text-[10px] sm:text-xs tracking-wide uppercase transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.299-.018-.461.13-.611.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  WHATSAPP
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-slate-700 hover:bg-white hover:text-slate-900 z-10 shadow-sm transition-colors"
              onClick={closeModal}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            
            {/* Modal Image */}
            {getProductImages(selectedProduct).length > 0 ? (
              <div className="w-full h-64 sm:h-80 bg-slate-100 overflow-x-auto snap-x snap-mandatory flex scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                {getProductImages(selectedProduct).map((image, index) => (
                  <div key={index} className="w-full h-full flex-shrink-0 snap-start">
                    <img
                      src={image}
                      alt={`${selectedProduct.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-64 sm:h-80 bg-slate-100 flex items-center justify-center text-slate-400 italic">
                No Image Available
              </div>
            )}

            {/* Modal Content */}
            <div className="p-5 sm:p-6">
              <h3 className="text-xl font-bold text-slate-800 leading-tight">{selectedProduct.name}</h3>
              <p className="text-2xl font-black text-orange-600 mt-2">₹{selectedProduct.price}</p>
              
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedProduct.details || 'No additional details available.'}</p>
              </div>
              
              <button
                onClick={() => {
                  handleOrderClick(selectedProduct);
                  closeModal();
                }}
                className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl text-sm sm:text-base tracking-wide uppercase transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.299-.018-.461.13-.611.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Order via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
