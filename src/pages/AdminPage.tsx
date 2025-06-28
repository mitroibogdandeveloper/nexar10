import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, Settings, 
  ChevronDown, ChevronUp, Eye, Edit, Trash2, 
  CheckCircle, XCircle, AlertTriangle, Search,
  User, Building, Calendar, Clock, Filter, RefreshCw
} from 'lucide-react';
import { admin, supabase } from '../lib/supabase';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('listings');
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentListing, setCurrentListing] = useState<any>(null);
  const [editedListing, setEditedListing] = useState<any>({});
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set a timeout to show an error message if loading takes too long
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Loading timeout reached in AdminPage');
        setError('Încărcarea durează mai mult decât de obicei. Te rugăm să reîmprospătezi pagina sau să verifici conexiunea.');
        setIsLoading(false);
      }
    }, 15000); // 15 seconds timeout
    
    setLoadingTimeout(timeout);
    
    checkAdminStatus();
    
    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, []);

  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      
      // Verificăm dacă utilizatorul este admin
      const isAdminUser = await admin.isAdmin();
      
      if (!isAdminUser) {
        // Dacă nu este admin, redirecționăm la pagina principală
        navigate('/');
        return;
      }
      
      setIsAdmin(true);
      
      // Încărcăm datele inițiale
      if (activeTab === 'listings') {
        loadListings();
      } else {
        loadUsers();
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError('A apărut o eroare la verificarea statusului de administrator');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'listings') {
        loadListings();
      } else {
        loadUsers();
      }
    }
  }, [activeTab, isAdmin]);

  const loadListings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await admin.getAllListings();
      
      if (error) {
        console.error('Error loading listings:', error);
        setError('Nu s-au putut încărca anunțurile');
        return;
      }
      
      setListings(data || []);
    } catch (err) {
      console.error('Error loading listings:', err);
      setError('A apărut o eroare la încărcarea anunțurilor');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await admin.getAllUsers();
      
      if (error) {
        console.error('Error loading users:', error);
        setError('Nu s-au putut încărca utilizatorii');
        return;
      }
      
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('A apărut o eroare la încărcarea utilizatorilor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (listingId: string, status: string) => {
    try {
      setIsUpdating(listingId);
      
      const { error } = await admin.updateListingStatus(listingId, status);
      
      if (error) {
        console.error('Error updating listing status:', error);
        alert('Eroare la actualizarea statusului anunțului');
        return;
      }
      
      // Actualizăm lista de anunțuri
      setListings(prev => 
        prev.map(listing => 
          listing.id === listingId ? { ...listing, status } : listing
        )
      );
      
      alert(`Statusul anunțului a fost actualizat la "${status}"`);
    } catch (err) {
      console.error('Error updating listing status:', err);
      alert('A apărut o eroare la actualizarea statusului anunțului');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest anunț?')) return;
    
    try {
      setIsDeleting(listingId);
      
      const { error } = await admin.deleteListing(listingId);
      
      if (error) {
        console.error('Error deleting listing:', error);
        alert('Eroare la ștergerea anunțului');
        return;
      }
      
      // Actualizăm lista de anunțuri
      setListings(prev => prev.filter(listing => listing.id !== listingId));
      
      alert('Anunțul a fost șters cu succes!');
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert('A apărut o eroare la ștergerea anunțului');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleUserStatus = async (userId: string, suspended: boolean) => {
    try {
      const { error } = await admin.toggleUserStatus(userId, suspended);
      
      if (error) {
        console.error('Error toggling user status:', error);
        alert('Eroare la actualizarea statusului utilizatorului');
        return;
      }
      
      // Actualizăm lista de utilizatori
      setUsers(prev => 
        prev.map(user => 
          user.user_id === userId ? { ...user, suspended } : user
        )
      );
      
      alert(`Utilizatorul a fost ${suspended ? 'suspendat' : 'activat'} cu succes!`);
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert('A apărut o eroare la actualizarea statusului utilizatorului');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest utilizator? Toate anunțurile sale vor fi șterse definitiv.')) return;
    
    try {
      setIsDeletingUser(userId);
      
      const { error } = await admin.deleteUser(userId);
      
      if (error) {
        console.error('Error deleting user:', error);
        alert('Eroare la ștergerea utilizatorului');
        return;
      }
      
      // Actualizăm lista de utilizatori
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      
      // Reîncărcăm și anunțurile pentru a reflecta schimbările
      loadListings();
      
      alert('Utilizatorul și toate anunțurile sale au fost șterse cu succes!');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('A apărut o eroare la ștergerea utilizatorului');
    } finally {
      setIsDeletingUser(null);
    }
  };

  const handleEditListing = (listing: any) => {
    setCurrentListing(listing);
    setEditedListing({
      title: listing.title,
      price: listing.price,
      description: listing.description,
      status: listing.status,
      featured: listing.featured,
      category: listing.category,
      brand: listing.brand,
      model: listing.model,
      year: listing.year,
      mileage: listing.mileage,
      engine_capacity: listing.engine_capacity,
      fuel_type: listing.fuel_type,
      transmission: listing.transmission,
      condition: listing.condition,
      color: listing.color,
      location: listing.location
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({
          title: editedListing.title,
          price: parseFloat(editedListing.price),
          description: editedListing.description,
          status: editedListing.status,
          featured: editedListing.featured,
          category: editedListing.category,
          brand: editedListing.brand,
          model: editedListing.model,
          year: parseInt(editedListing.year),
          mileage: parseInt(editedListing.mileage),
          engine_capacity: parseInt(editedListing.engine_capacity),
          fuel_type: editedListing.fuel_type,
          transmission: editedListing.transmission,
          condition: editedListing.condition,
          color: editedListing.color,
          location: editedListing.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentListing.id);
      
      if (error) {
        console.error('Error updating listing:', error);
        alert('Eroare la actualizarea anunțului');
        return;
      }
      
      // Actualizăm lista de anunțuri
      setListings(prev => 
        prev.map(listing => 
          listing.id === currentListing.id ? { 
            ...listing, 
            title: editedListing.title,
            price: parseFloat(editedListing.price),
            description: editedListing.description,
            status: editedListing.status,
            featured: editedListing.featured,
            category: editedListing.category,
            brand: editedListing.brand,
            model: editedListing.model,
            year: parseInt(editedListing.year),
            mileage: parseInt(editedListing.mileage),
            engine_capacity: parseInt(editedListing.engine_capacity),
            fuel_type: editedListing.fuel_type,
            transmission: editedListing.transmission,
            condition: editedListing.condition,
            color: editedListing.color,
            location: editedListing.location
          } : listing
        )
      );
      
      setShowEditModal(false);
      alert('Anunțul a fost actualizat cu succes!');
    } catch (err) {
      console.error('Error updating listing:', err);
      alert('A apărut o eroare la actualizarea anunțului');
    }
  };

  // Filtrare anunțuri
  const filteredListings = listings.filter(listing => {
    const matchesSearch = !searchQuery || 
      listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filtrare utilizatori
  const filteredUsers = users.filter(user => 
    !searchQuery || 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 border-4 border-nexar-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă panoul de administrare...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Eroare
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-nexar-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-nexar-gold transition-colors"
          >
            Reîncarcă Pagina
          </button>
        </div>
      </div>
    );
  }

  // Not admin state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acces Interzis
          </h2>
          <p className="text-gray-600 mb-6">
            Nu ai permisiunea de a accesa panoul de administrare.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-nexar-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-nexar-gold transition-colors"
          >
            Înapoi la Pagina Principală
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="lg:w-64 bg-gray-900 text-white lg:min-h-screen">
          <div className="p-4 lg:p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center">
              <Settings className="mr-2 h-6 w-6" />
              Admin Panel
            </h1>
            
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('listings')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'listings' 
                    ? 'bg-nexar-accent text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Package className="h-5 w-5" />
                <span>Anunțuri</span>
              </button>
              
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'users' 
                    ? 'bg-nexar-accent text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Utilizatori</span>
              </button>
              
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'dashboard' 
                    ? 'bg-nexar-accent text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8">
          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                  <h2 className="text-2xl font-bold text-gray-900">Gestionare Anunțuri</h2>
                  
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Caută anunțuri..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    </div>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    >
                      <option value="all">Toate statusurile</option>
                      <option value="active">Active</option>
                      <option value="pending">În așteptare</option>
                      <option value="sold">Vândute</option>
                      <option value="rejected">Respinse</option>
                    </select>
                    
                    <button
                      onClick={loadListings}
                      className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Reîncarcă</span>
                    </button>
                  </div>
                </div>
                
                {/* Listings Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Anunț
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Vânzător
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Preț
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Data
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acțiuni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredListings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            {searchQuery || statusFilter !== 'all' 
                              ? 'Nu am găsit anunțuri care să corespundă criteriilor de căutare' 
                              : 'Nu există anunțuri în baza de date'}
                          </td>
                        </tr>
                      ) : (
                        filteredListings.map(listing => (
                          <tr key={listing.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex items-start space-x-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                  <img 
                                    src={listing.images && listing.images[0] ? listing.images[0] : "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg"} 
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.src = "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg";
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{listing.title}</div>
                                  <div className="text-sm text-gray-500 flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{listing.year}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 hidden sm:table-cell">
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{listing.seller_name}</span>
                                <span className="text-sm text-gray-500">{listing.seller_type === 'dealer' ? 'Dealer' : 'Individual'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 hidden lg:table-cell">
                              <span className="font-medium text-gray-900">€{listing.price.toLocaleString()}</span>
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                listing.status === 'active' ? 'bg-green-100 text-green-800' :
                                listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {listing.status === 'active' ? 'Activ' :
                                 listing.status === 'pending' ? 'În așteptare' :
                                 listing.status === 'sold' ? 'Vândut' : 'Respins'}
                              </span>
                            </td>
                            <td className="px-4 py-4 hidden lg:table-cell">
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-500">
                                  {new Date(listing.created_at).toLocaleDateString('ro-RO')}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(listing.created_at).toLocaleTimeString('ro-RO', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => window.open(`/anunt/${listing.id}`, '_blank')}
                                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                                  title="Vezi anunțul"
                                >
                                  <Eye className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleEditListing(listing)}
                                  className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                                  title="Editează anunțul"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  disabled={isDeleting === listing.id}
                                  className="p-1 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                  title="Șterge anunțul"
                                >
                                  {isDeleting === listing.id ? (
                                    <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Trash2 className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                  <h2 className="text-2xl font-bold text-gray-900">Gestionare Utilizatori</h2>
                  
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Caută utilizatori..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    </div>
                    
                    <button
                      onClick={loadUsers}
                      className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Reîncarcă</span>
                    </button>
                  </div>
                </div>
                
                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilizator
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Tip
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Data Înregistrării
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acțiuni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            {searchQuery 
                              ? 'Nu am găsit utilizatori care să corespundă criteriilor de căutare' 
                              : 'Nu există utilizatori în baza de date'}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  {user.avatar_url ? (
                                    <img 
                                      src={user.avatar_url} 
                                      alt={user.name}
                                      className="w-full h-full rounded-full object-cover"
                                      onError={(e) => {
                                        const target = e.currentTarget as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <span className="text-lg font-semibold text-gray-500">
                                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500 md:hidden">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                              <span className="text-gray-900">{user.email}</span>
                            </td>
                            <td className="px-4 py-4 hidden lg:table-cell">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.seller_type === 'dealer' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.seller_type === 'dealer' ? 'Dealer' : 'Individual'}
                              </span>
                              {user.is_admin && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Admin
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 hidden lg:table-cell">
                              <div className="text-sm text-gray-500">
                                {new Date(user.created_at).toLocaleDateString('ro-RO')}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => navigate(`/profil/${user.id}`)}
                                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                                  title="Vezi profilul"
                                >
                                  <Eye className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(user.user_id, !user.suspended)}
                                  className={`p-1 transition-colors ${
                                    user.suspended 
                                      ? 'text-green-500 hover:text-green-700' 
                                      : 'text-red-500 hover:text-red-700'
                                  }`}
                                  title={user.suspended ? 'Activează utilizatorul' : 'Suspendă utilizatorul'}
                                >
                                  {user.suspended ? (
                                    <CheckCircle className="h-5 w-5" />
                                  ) : (
                                    <XCircle className="h-5 w-5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.user_id)}
                                  disabled={isDeletingUser === user.user_id}
                                  className="p-1 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                  title="Șterge utilizatorul"
                                >
                                  {isDeletingUser === user.user_id ? (
                                    <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Trash2 className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-blue-800">Anunțuri Active</h3>
                      <Package className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-blue-900">
                      {listings.filter(l => l.status === 'active').length}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-green-800">Utilizatori</h3>
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-green-900">
                      {users.length}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-yellow-800">Dealeri</h3>
                      <Building className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div className="text-3xl font-bold text-yellow-900">
                      {users.filter(u => u.seller_type === 'dealer').length}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-purple-800">Anunțuri Noi</h3>
                      <Clock className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="text-3xl font-bold text-purple-900">
                      {listings.filter(l => {
                        const date = new Date(l.created_at);
                        const now = new Date();
                        const diffTime = Math.abs(now.getTime() - date.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 7;
                      }).length}
                    </div>
                    <div className="text-sm text-purple-700 mt-2">Ultimele 7 zile</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && currentListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Editare Anunț</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titlu
                  </label>
                  <input
                    type="text"
                    value={editedListing.title}
                    onChange={(e) => setEditedListing(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preț (EUR)
                  </label>
                  <input
                    type="number"
                    value={editedListing.price}
                    onChange={(e) => setEditedListing(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categorie
                    </label>
                    <select
                      value={editedListing.category}
                      onChange={(e) => setEditedListing(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    >
                      {categories.map(cat => (
                        <option key={cat.toLowerCase()} value={cat.toLowerCase()}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marcă
                    </label>
                    <select
                      value={editedListing.brand}
                      onChange={(e) => setEditedListing(prev => ({ ...prev, brand: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    >
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      value={editedListing.model}
                      onChange={(e) => setEditedListing(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      An
                    </label>
                    <input
                      type="number"
                      value={editedListing.year}
                      onChange={(e) => setEditedListing(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kilometraj
                    </label>
                    <input
                      type="number"
                      value={editedListing.mileage}
                      onChange={(e) => setEditedListing(prev => ({ ...prev, mileage: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacitate motor (cc)
                    </label>
                    <input
                      type="number"
                      value={editedListing.engine_capacity}
                      onChange={(e) => setEditedListing(prev => ({ ...prev, engine_capacity: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Combustibil
                    </label>
                    <select
                      value={editedListing.fuel_type}
                      onChange={(e) => setEditedListing(prev => ({ ...prev, fuel_type: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    >
                      <option value="benzina">Benzină</option>
                      <option value="electric">Electric</option>
                      <option value="hibrid">Hibrid</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transmisie
                    </label>
                    <select
                      value={editedListing.transmission}
                      onChange={(e) => setEditedListing(prev => ({ ...prev, transmission: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    >
                      <option value="manuala">Manuală</option>
                      <option value="automata">Automată</option>
                      <option value="semi-automata">Semi-automată</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Culoare
                    </label>
                    <input
                      type="text"
                      value={editedListing.color}
                      onChange={(e) => setEditedListing(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stare
                    </label>
                    <select
                      value={editedListing.condition}
                      onChange={(e) => setEditedListing(prev => ({ ...prev, condition: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    >
                      <option value="noua">Nouă</option>
                      <option value="excelenta">Excelentă</option>
                      <option value="foarte_buna">Foarte bună</option>
                      <option value="buna">Bună</option>
                      <option value="satisfacatoare">Satisfăcătoare</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Locație
                    </label>
                    <select
                      value={editedListing.location}
                      onChange={(e) => setEditedListing(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    >
                      <option value="">Selectează orașul</option>
                      <option value="București S1">București S1</option>
                      <option value="București S2">București S2</option>
                      <option value="București S3">București S3</option>
                      <option value="București S4">București S4</option>
                      <option value="București S5">București S5</option>
                      <option value="București S6">București S6</option>
                      <option value="Cluj-Napoca">Cluj-Napoca</option>
                      <option value="Timișoara">Timișoara</option>
                      <option value="Iași">Iași</option>
                      <option value="Constanța">Constanța</option>
                      <option value="Brașov">Brașov</option>
                      <option value="Craiova">Craiova</option>
                      <option value="Galați">Galați</option>
                      <option value="Oradea">Oradea</option>
                      <option value="Ploiești">Ploiești</option>
                      <option value="Sibiu">Sibiu</option>
                      <option value="Bacău">Bacău</option>
                      <option value="Râmnicu Vâlcea">Râmnicu Vâlcea</option>
                      <option value="Rm. Vâlcea">Rm. Vâlcea</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descriere
                  </label>
                  <textarea
                    value={editedListing.description}
                    onChange={(e) => setEditedListing(prev => ({ ...prev, description: e.target.value }))}
                    rows={5}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editedListing.status}
                    onChange={(e) => setEditedListing(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                  >
                    <option value="active">Activ</option>
                    <option value="pending">În așteptare</option>
                    <option value="sold">Vândut</option>
                    <option value="rejected">Respins</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={editedListing.featured}
                    onChange={(e) => setEditedListing(prev => ({ ...prev, featured: e.target.checked }))}
                    className="h-4 w-4 text-nexar-accent focus:ring-nexar-accent border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                    Anunț Premium
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Anulează
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-nexar-accent text-white rounded-lg hover:bg-nexar-gold transition-colors"
                >
                  Salvează Modificările
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;