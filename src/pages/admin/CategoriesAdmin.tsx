import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Category } from '../../types';
import { toast } from 'sonner';
import { Trash2, Edit2, Plus, Loader2 } from 'lucide-react';

export function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await apiService.getCategories();
      setCategories(data);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    try {
      if (editingCat) {
        await apiService.updateCategory(editingCat.id, { name });
        toast.success('Category updated');
      } else {
        await apiService.createCategory({ name });
        toast.success('Category created');
      }
      setEditingCat(null);
      (e.target as HTMLFormElement).reset();
      await loadCategories();
    } catch (err) {
      toast.error('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await apiService.deleteCategory(id);
      toast.success('Category deleted');
      await loadCategories();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 leading-tight">Manage Categories</h2>
        <p className="text-sm text-gray-500 mt-1">Organize your products into categories.</p>
      </div>

      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">{editingCat ? 'Edit Category' : 'Add New Category'}</h3>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            name="name"
            required
            defaultValue={editingCat?.name || ''}
            placeholder="e.g., Heavy Wiring"
            className="flex-1 rounded-xl border border-gray-300 py-2.5 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-shop-yellow text-shop-gray px-5 py-2.5 rounded-lg font-bold hover:opacity-90 transition-colors flex items-center gap-2 disabled:opacity-50 uppercase tracking-wide text-sm"
          >
            {editingCat ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingCat ? 'Save' : 'Add'}
          </button>
          {editingCat && (
            <button
              type="button"
              onClick={() => setEditingCat(null)}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold uppercase tracking-wide text-sm"
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="divide-y divide-gray-100">
        {categories.map(cat => (
          <div key={cat.id} className="py-4 flex justify-between items-center group">
            <span className="font-medium text-gray-900">{cat.name}</span>
            <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditingCat(cat)}
                className="p-2 text-gray-400 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-gray-500 text-center py-8">No categories found.</p>
        )}
      </div>
    </div>
  );
}
