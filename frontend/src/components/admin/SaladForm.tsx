'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { buildApiUrl } from '@/lib/api';

interface SaladFormProps {
  salad?: {
    _id: string;
    nombre: string;
    precioBase: number;
    ingredientesDefault: string[];
    imagenUrl: string;
    descripcion?: string;
    estaActiva: boolean;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SaladForm({ salad, onClose, onSuccess }: SaladFormProps) {
  const isEditing = !!salad;
  
  const [formData, setFormData] = useState({
    nombre: '',
    precioBase: 0,
    ingredientesDefault: [] as string[],
    imagenUrl: '',
    descripcion: '',
    estaActiva: true,
  });
  
  const [newIngredient, setNewIngredient] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (salad) {
      setFormData({
        nombre: salad.nombre,
        precioBase: salad.precioBase,
        ingredientesDefault: [...salad.ingredientesDefault],
        imagenUrl: salad.imagenUrl,
        descripcion: salad.descripcion || '',
        estaActiva: salad.estaActiva,
      });
      setImagePreview(salad.imagenUrl);
      setImageFile(null);
    }
  }, [salad]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (formData.precioBase <= 0) {
      newErrors.precioBase = 'El precio debe ser mayor a 0';
    }
    
    if (!imageFile && !formData.imagenUrl.trim()) {
      newErrors.imagenUrl = 'Debes adjuntar una imagen';
    }
    
    if (formData.ingredientesDefault.length === 0) {
      newErrors.ingredientes = 'Debe incluir al menos un ingrediente';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const folder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER;

    if (!cloudName || !uploadPreset) {
      throw new Error('Faltan variables NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME o NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
    }

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', uploadPreset);
    if (folder) data.append('folder', folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: data,
    });

    const result = await response.json();
    if (!response.ok || !result.secure_url) {
      throw new Error(result.error?.message || 'No se pudo subir la imagen a Cloudinary');
    }

    return result.secure_url as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      let imagenUrlFinal = formData.imagenUrl;

      if (imageFile) {
        setUploadingImage(true);
        imagenUrlFinal = await uploadImageToCloudinary(imageFile);
      }

      const url = buildApiUrl('/api/salads');
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? { ...formData, imagenUrl: imagenUrlFinal, id: salad!._id }
        : { ...formData, imagenUrl: imagenUrlFinal };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const result = await response.json();
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error guardando ensalada:', error);
      const message = error instanceof Error ? error.message : 'Error al guardar la ensalada';
      alert(message);
    } finally {
      setUploadingImage(false);
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    if (!newIngredient.trim()) return;
    
    if (formData.ingredientesDefault.includes(newIngredient.trim())) {
      alert('Este ingrediente ya existe');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      ingredientesDefault: [...prev.ingredientesDefault, newIngredient.trim()],
    }));
    setNewIngredient('');
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setFormData(prev => ({
      ...prev,
      ingredientesDefault: prev.ingredientesDefault.filter(i => i !== ingredient),
    }));
  };

  const handleImageFileChange = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, imagenUrl: 'El archivo debe ser una imagen' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, imagenUrl: 'La imagen no puede superar 5MB' }));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(objectUrl);
    setErrors(prev => {
      const next = { ...prev };
      delete next.imagenUrl;
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Editar Ensalada' : 'Nueva Ensalada'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Imagen preview */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Vista previa de imagen</label>
            <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  onError={() => setImagePreview('')}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Imagen */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Imagen *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageFileChange(e.target.files?.[0] || null)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.imagenUrl ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="text-xs text-gray-500">
              Formatos sugeridos: JPG, PNG o WEBP. Tamaño máximo: 5MB.
            </p>
            {errors.imagenUrl && <p className="text-red-500 text-sm">{errors.imagenUrl}</p>}
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.nombre ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nombre de la ensalada"
            />
            {errors.nombre && <p className="text-red-500 text-sm">{errors.nombre}</p>}
          </div>

          {/* Precio */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Precio base *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.precioBase}
                onChange={(e) => setFormData(prev => ({ ...prev, precioBase: Number(e.target.value) }))}
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.precioBase ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
              />
            </div>
            {errors.precioBase && <p className="text-red-500 text-sm">{errors.precioBase}</p>}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Descripción de la ensalada..."
              rows={3}
            />
          </div>

          {/* Ingredientes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Ingredientes por defecto *
            </label>
            
            {/* Lista de ingredientes */}
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.ingredientesDefault.map((ingredient) => (
                <span
                  key={ingredient}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {ingredient}
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(ingredient)}
                    className="hover:text-green-900"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            
            {errors.ingredientes && <p className="text-red-500 text-sm mb-2">{errors.ingredientes}</p>}
            
            {/* Agregar ingrediente */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nuevo ingrediente"
              />
              <button
                type="button"
                onClick={handleAddIngredient}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Estado activo */}
          {isEditing && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="estaActiva"
                checked={formData.estaActiva}
                onChange={(e) => setFormData(prev => ({ ...prev, estaActiva: e.target.checked }))}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <label htmlFor="estaActiva" className="text-sm font-medium text-gray-700">
                Ensalada activa (visible para clientes)
              </label>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {uploadingImage ? 'Subiendo imagen...' : 'Guardando...'}
                </span>
              ) : (
                isEditing ? 'Guardar cambios' : 'Crear ensalada'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
