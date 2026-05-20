import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Product, Category } from '../../types';
import { toast } from 'sonner';
import { Trash2, Edit2, Plus, Loader2, Image as ImageIcon, Save } from 'lucide-react';

export function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        apiService.getProducts(),
        apiService.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (product?: Product) => {
    if (product) {
      setEditingProd(product);
      setImagePreview(product.imageUrl || null);
    } else {
      setEditingProd(null);
      setImagePreview(null);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProd(null);
    setImagePreview(null);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data: Omit<Product, 'id'> = {
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      details: formData.get('details') as string,
      categoryId: formData.get('categoryId') as string,
      imageUrl: imagePreview || undefined,
    };

    try {
      if (editingProd) {
        await apiService.updateProduct(editingProd.id, data);
        toast.success('Product updated');
      } else {
        await apiService.createProduct(data);
        toast.success('Product created');
      }
      handleCloseForm();
      await loadData();
    } catch (err) {
      toast.error('Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiService.deleteProduct(id);
      toast.success('Product deleted');
      await loadData();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  if (isFormOpen) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{editingProd ? 'Edit Product' : 'Add New Product'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5 bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Product Name</label>
            <input type="text" name="name" required defaultValue={editingProd?.name || ''} className="w-full rounded-xl border border-gray-300 py-2.5 px-4 focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-900 mb-1">Price (₹)</label>
              <input type="number" name="price" required min="0" step="1" defaultValue={editingProd?.price || ''} className="w-full rounded-xl border border-gray-300 py-2.5 px-4 focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-900 mb-1">Category</label>
              <select name="categoryId" required defaultValue={editingProd?.categoryId || ''} className="w-full rounded-xl border border-gray-300 py-2.5 px-4 focus:ring-2 focus:ring-amber-500 outline-none bg-white">
                <option value="" disabled>Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Product Details</label>
            <textarea name="details" required rows={3} defaultValue={editingProd?.details || ''} className="w-full rounded-xl border border-gray-300 py-2.5 px-4 focus:ring-2 focus:ring-amber-500 outline-none resize-none"></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Product Image (Optional)</label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-xl border border-gray-200 overflow-hidden shrink-0 group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all cursor-pointer" onClick={() => setImagePreview(null)}>
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input type="file" accept="image/*" id="imageUpload" className="hidden" onChange={handleImageChange} />
                <label htmlFor="imageUpload" className="inline-block bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                  Choose Photo
                </label>
                <p className="text-xs text-gray-500 mt-2">Max limit: 2MB. Jpeg, Png accepted.</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-gray-200">
             <button type="submit" disabled={isSubmitting} className="bg-shop-yellow text-shop-gray px-6 py-2.5 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 uppercase tracking-wide text-sm">
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               Save Product
             </button>
             <button type="button" onClick={handleCloseForm} className="px-6 py-2.5 rounded-lg font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wide text-sm">
               Cancel
             </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-tight">Manage Products</h2>
          <p className="text-sm text-gray-500 mt-1">Add or update your catalog items.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="bg-shop-yellow hover:bg-[#eab308] text-shop-gray px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors uppercase tracking-wide"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Product</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-sm">
              <th className="py-3 px-4 font-semibold w-16">Image</th>
              <th className="py-3 px-4 font-semibold">Name</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold">Price</th>
              <th className="py-3 px-4 font-semibold whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => {
              const catName = categories.find(c => c.id === product.categoryId)?.name || 'Unknown';
              return (
                <tr key={product.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-white border border-gray-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{product.details}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded-md">{catName}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-amber-700">₹{product.price}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenForm(product)} className="p-2 text-gray-500 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No products found. Start by adding a new product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
