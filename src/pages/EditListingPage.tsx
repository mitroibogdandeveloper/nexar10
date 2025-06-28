import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Plus, Check, AlertTriangle, Camera, ArrowLeft, ChevronDown } from 'lucide-react';
import { listings, isAuthenticated, supabase, romanianCities } from '../lib/supabase';
import SuccessModal from '../components/SuccessModal';

const EditListingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [originalListing, setOriginalListing] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    mileage: '',
    year: '',
    location: '',
    condition: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      setIsLoading(true);
      
      const isLoggedIn = await isAuthenticated();
      if (!isLoggedIn) {
        navigate('/auth');
        return;
      }

      if (!id) {
        navigate('/profil');
        return;
      }

      const { data: listingData, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !listingData) {
        alert('Anunțul nu a fost găsit');
        navigate('/profil');
        return;
      }

      // Verifică proprietatea
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!profile || profile.id !== listingData.seller_id) {
        alert('Nu poți edita acest anunț');
        navigate('/profil');
        return;
      }

      setOriginalListing(listingData);
      setFormData({
        title: listingData.title || '',
        price: listingData.price?.toString() || '',
        description: listingData.description || '',
        mileage: listingData.mileage?.toString() || '',
        year: listingData.year?.toString() || '',
        location: listingData.location || '',
        condition: listingData.condition || '',
        phone: profile.phone || '',
        email: profile.email || ''
      });

    } catch (err) {
      console.error('Error:', err);
      navigate('/profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Titlul este obligatoriu';
    if (!formData.price) newErrors.price = 'Prețul este obligatoriu';
    if (!formData.description.trim()) newErrors.description = 'Descrierea este obligatorie';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('listings')
        .update({
          title: formData.title.trim(),
          price: parseFloat(formData.price),
          description: formData.description.trim(),
          mileage: parseInt(formData.mileage) || originalListing.mileage,
          year: parseInt(formData.year) || originalListing.year,
          location: formData.location.trim() || originalListing.location,
          condition: formData.condition || originalListing.condition,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setShowSuccessModal(true);
      
    } catch (error: any) {
      console.error('Error updating listing:', error);
      alert('Eroare la actualizarea anunțului: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-nexar-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/profil')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Înapoi la profil</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Editează Anunțul</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titlu *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-nexar-accent focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ex: Yamaha YZF-R1 2023"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preț (EUR) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-nexar-accent focus:border-transparent ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="18500"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descriere *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={8}
                className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-nexar-accent focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Descrie motocicleta în detaliu..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kilometraj
                </label>
                <input
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => handleInputChange('mileage', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                  placeholder="25000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  An fabricație
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                  placeholder="2023"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locația
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                placeholder="București"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/profil')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Anulează
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-nexar-accent text-white rounded-lg font-semibold hover:bg-nexar-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Se salvează...' : 'Salvează Modificările'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onGoHome={() => navigate('/profil')}
        title="Succes!"
        message="Anunțul a fost actualizat cu succes!"
      />
    </div>
  );
};

export default EditListingPage;