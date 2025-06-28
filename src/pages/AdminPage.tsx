import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Package, Settings, Search, Filter, 
  ChevronDown, ChevronUp, Edit, Trash2, Eye, 
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
  User, Building, Calendar, MapPin, Clock
} from 'lucide-react';
import { admin, supabase } from '../lib/supabase';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('listings');
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificăm dacă utilizatorul este admin
      const isAdminUser = await admin.isAdmin();
      
      if (!isAdminUser) {
        setError('Nu ai permisiunea de a accesa această pagină. Doar administratorii pot vedea panoul de administrare.');
        setIsAdmin(false);
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
      setError('A apărut o eroare la verificarea statusului de administrator.');
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadListings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await admin.getAllListings();
      
      if (error) {
        console.error('Error loading listings:', error);
        setError('A apărut o eroare la încărcarea anunțurilor.');
        return;
      }
      
      setListings(data || []);
    } catch (err) {
      console.error('Error loading listings:', err);
      setError('A apărut o eroare la încărcarea anunțurilor.');
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
        setError('A apărut o eroare la încărcarea utilizatorilor.');
        return;
      }
      
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('A apărut o eroare la încărcarea utilizatorilor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery('');
    setStatusFilter('all');
    
    if (tab === 'listings') {
      loadListings();
    } else {
      loadUsers();
    }
  };

  const toggleListingExpand = (id: string) => {
    setExpandedListing(expandedListing === id ? null : id);
  };

  const toggleUserExpand = (id: string) => {
    setExpandedUser(expandedUser === id ? null : id);
  };

  const handleUpdateListingStatus = async (listingId: string, status: string) => {
    try {
      setIsUpdatingStatus(prev => ({ ...prev, [listingId]: true }));
      
      const { error } = await admin.updateListingStatus(listingId, status);
      
      if (error) {
        console.error('Error updating listing status:', error);
        alert(`Eroare la actualizarea statusului: ${error.message}`);
        return;
      }
      
      // Actualizăm lista de anunțuri
      setListings(prev => 
        prev.map(listing => 
          listing.id === listingId ? { ...listing, status } : listing
        )
      );
      
      alert(`Statusul anunțului a fost actualizat la: ${status}`);
    } catch (err) {
      console.error('Error updating listing status:', err);
      alert('A apărut o eroare la actualizarea statusului.');
    } finally {
      setIsUpdatingStatus(prev => ({ ...prev, [listingId]: false }));
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest anunț?')) return;
    
    try {
      setIsDeleting(prev => ({ ...prev, [listingId]: true }));
      
      const { error } = await admin.deleteListing(listingId);
      
      if (error) {
        console.error('Error deleting listing:', error);
        alert(`Eroare la ștergerea anunțului: ${error.message}`);
        return;
      }
      
      // Eliminăm anunțul din listă
      setListings(prev => prev.filter(listing => listing.id !== listingId));
      
      alert('Anunțul a fost șters cu succes!');
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert('A apărut o eroare la ștergerea anunțului.');
    } finally {
      setIsDeleting(prev => ({ ...prev, [listingId]: false }));
    }
  };

  const handleToggleUserStatus = async (userId: string, suspended: boolean) => {
    try {
      setIsUpdatingStatus(prev => ({ ...prev, [userId]: true }));
      
      const { error } = await admin.toggleUserStatus(userId, suspended);
      
      if (error) {
        console.error('Error toggling user status:', error);
        alert(`Eroare la actualizarea statusului utilizatorului: ${error.message}`);
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
      alert('A apărut o eroare la actualizarea statusului utilizatorului.');
    } finally {
      setIsUpdatingStatus(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest utilizator? Această acțiune va șterge și toate anunțurile asociate.')) return;
    
    try {
      setIsDeleting(prev => ({ ...prev, [userId]: true }));
      
      // Obținem profilul utilizatorului pentru a avea ID-ul profilului
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        alert(`Eroare la obținerea profilului utilizatorului: ${profileError.message}`);
        return;
      }
      
      // Ștergem toate anunțurile utilizatorului
      const { error: listingsError } = await supabase
        .from('listings')
        .delete()
        .eq('seller_id', profile.id);
      
      if (listingsError) {
        console.error('Error deleting user listings:', listingsError);
        alert(`Eroare la ștergerea anunțurilor utilizatorului: ${listingsError.message}`);
        return;
      }
      
      // Ștergem profilul utilizatorului
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (deleteProfileError) {
        console.error('Error deleting user profile:', deleteProfileError);
        alert(`Eroare la ștergerea profilului utilizatorului: ${deleteProfileError.message}`);
        return;
      }
      
      // Ștergem utilizatorul din auth
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
      
      if (deleteUserError) {
        console.error('Error deleting auth user:', deleteUserError);
        alert(`Eroare la ștergerea utilizatorului: ${deleteUserError.message}`);
        return;
      }
      
      // Eliminăm utilizatorul din listă
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      
      alert('Utilizatorul și toate anunțurile sale au fost șterse cu succes!');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('A apărut o eroare la ștergerea utilizatorului.');
    } finally {
      setIsDeleting(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Filtrare anunțuri
  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      searchQuery === '' || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      listing.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filtrare utilizatori
  const filteredUsers = users.filter(user => 
    searchQuery === '' || 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dacă nu este admin, afișăm mesaj de eroare
  if (!isAdmin && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acces restricționat
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Nu ai permisiunea de a accesa această pagină. Doar administratorii pot vedea panoul de administrare.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-nexar-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-nexar-gold transition-colors"
          >
            Înapoi la pagina principală
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 text-white p-6">
            <h1 className="text-2xl font-bold">Panou de Administrare</h1>
            <p className="text-gray-300">Gestionează anunțurile și utilizatorii platformei</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabChange('listings')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'listings'
                  ? 'text-nexar-accent border-b-2 border-nexar-accent'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="h-5 w-5" />
              <span>Anunțuri</span>
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'text-nexar-accent border-b-2 border-nexar-accent'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Utilizatori</span>
            </button>
            <button
              onClick={() => handleTabChange('settings')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'settings'
                  ? 'text-nexar-accent border-b-2 border-nexar-accent'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Setări</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-nexar-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Se încarcă datele...</p>
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Eroare</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={checkAdminStatus}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Încearcă din nou</span>
                </button>
              </div>
            )}

            {/* Listings Tab */}
            {!isLoading && !error && activeTab === 'listings' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Gestionare Anunțuri</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Caută anunțuri..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexar-accent focus:border-transparent w-full sm:w-64"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    </div>
                    
                    {/* Filter */}
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
                  </div>
                </div>
                
                {/* Listings Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Anunț
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vânzător
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preț
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acțiuni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredListings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            Nu s-au găsit anunțuri care să corespundă criteriilor de căutare.
                          </td>
                        </tr>
                      ) : (
                        filteredListings.map(listing => (
                          <React.Fragment key={listing.id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <button
                                    onClick={() => toggleListingExpand(listing.id)}
                                    className="mr-3 text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    {expandedListing === listing.id ? (
                                      <ChevronUp className="h-5 w-5" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5" />
                                    )}
                                  </button>
                                  <div>
                                    <div className="font-medium text-gray-900">{listing.title}</div>
                                    <div className="text-sm text-gray-500">ID: {listing.id.substring(0, 8)}...</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  {listing.profiles?.seller_type === 'dealer' ? (
                                    <Building className="h-4 w-4 text-green-600 mr-2" />
                                  ) : (
                                    <User className="h-4 w-4 text-blue-600 mr-2" />
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">{listing.seller_name}</div>
                                    <div className="text-sm text-gray-500">{listing.profiles?.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  listing.status === 'active' ? 'bg-green-100 text-green-800' :
                                  listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {listing.status === 'active' ? 'Activ' :
                                   listing.status === 'pending' ? 'În așteptare' :
                                   listing.status === 'sold' ? 'Vândut' :
                                   'Respins'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">€{listing.price.toLocaleString()}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500">
                                  {new Date(listing.created_at).toLocaleDateString('ro-RO')}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => navigate(`/anunt/${listing.id}`)}
                                    className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                    title="Vezi anunțul"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => navigate(`/editeaza-anunt/${listing.id}`)}
                                    className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                                    title="Editează anunțul"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteListing(listing.id)}
                                    disabled={isDeleting[listing.id]}
                                    className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                                    title="Șterge anunțul"
                                  >
                                    {isDeleting[listing.id] ? (
                                      <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded Row */}
                            {expandedListing === listing.id && (
                              <tr>
                                <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Detalii Anunț</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-start">
                                          <span className="font-medium text-gray-700 w-32">Descriere:</span>
                                          <span className="text-gray-900">{listing.description || 'Fără descriere'}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-700 w-32">Marcă/Model:</span>
                                          <span className="text-gray-900">{listing.brand} {listing.model}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-700 w-32">An:</span>
                                          <span className="text-gray-900">{listing.year}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-700 w-32">Kilometraj:</span>
                                          <span className="text-gray-900">{listing.mileage.toLocaleString()} km</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-700 w-32">Locație:</span>
                                          <span className="text-gray-900">{listing.location}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Acțiuni</h4>
                                      <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                          <button
                                            onClick={() => handleUpdateListingStatus(listing.id, 'active')}
                                            disabled={listing.status === 'active' || isUpdatingStatus[listing.id]}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 ${
                                              listing.status === 'active'
                                                ? 'bg-green-100 text-green-800 cursor-default'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                          >
                                            {isUpdatingStatus[listing.id] ? (
                                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                            ) : (
                                              <CheckCircle className="h-4 w-4 mr-1" />
                                            )}
                                            <span>Activează</span>
                                          </button>
                                          
                                          <button
                                            onClick={() => handleUpdateListingStatus(listing.id, 'pending')}
                                            disabled={listing.status === 'pending' || isUpdatingStatus[listing.id]}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 ${
                                              listing.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800 cursor-default'
                                                : 'bg-yellow-600 text-white hover:bg-yellow-700'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                          >
                                            {isUpdatingStatus[listing.id] ? (
                                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                            ) : (
                                              <Clock className="h-4 w-4 mr-1" />
                                            )}
                                            <span>În așteptare</span>
                                          </button>
                                          
                                          <button
                                            onClick={() => handleUpdateListingStatus(listing.id, 'sold')}
                                            disabled={listing.status === 'sold' || isUpdatingStatus[listing.id]}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 ${
                                              listing.status === 'sold'
                                                ? 'bg-blue-100 text-blue-800 cursor-default'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                          >
                                            {isUpdatingStatus[listing.id] ? (
                                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                            ) : (
                                              <CheckCircle className="h-4 w-4 mr-1" />
                                            )}
                                            <span>Marcat ca vândut</span>
                                          </button>
                                          
                                          <button
                                            onClick={() => handleUpdateListingStatus(listing.id, 'rejected')}
                                            disabled={listing.status === 'rejected' || isUpdatingStatus[listing.id]}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 ${
                                              listing.status === 'rejected'
                                                ? 'bg-red-100 text-red-800 cursor-default'
                                                : 'bg-red-600 text-white hover:bg-red-700'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                          >
                                            {isUpdatingStatus[listing.id] ? (
                                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                            ) : (
                                              <XCircle className="h-4 w-4 mr-1" />
                                            )}
                                            <span>Respinge</span>
                                          </button>
                                        </div>
                                        
                                        <div className="pt-2">
                                          <button
                                            onClick={() => handleDeleteListing(listing.id)}
                                            disabled={isDeleting[listing.id]}
                                            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {isDeleting[listing.id] ? (
                                              <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                                            ) : (
                                              <Trash2 className="h-4 w-4 mr-1" />
                                            )}
                                            <span>Șterge Anunțul</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {!isLoading && !error && activeTab === 'users' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Gestionare Utilizatori</h2>
                  
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Caută utilizatori..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexar-accent focus:border-transparent w-full"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  </div>
                </div>
                
                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilizator
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tip
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Înregistrat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acțiuni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            Nu s-au găsit utilizatori care să corespundă criteriilor de căutare.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(user => (
                          <React.Fragment key={user.id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <button
                                    onClick={() => toggleUserExpand(user.id)}
                                    className="mr-3 text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    {expandedUser === user.id ? (
                                      <ChevronUp className="h-5 w-5" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5" />
                                    )}
                                  </button>
                                  <div>
                                    <div className="font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  user.seller_type === 'dealer'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {user.seller_type === 'dealer' ? 'Dealer' : 'Individual'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  user.suspended
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.suspended ? 'Suspendat' : 'Activ'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-500">
                                  {new Date(user.created_at).toLocaleDateString('ro-RO')}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => navigate(`/profil/${user.user_id}`)}
                                    className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                    title="Vezi profilul"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleUserStatus(user.user_id, !user.suspended)}
                                    disabled={isUpdatingStatus[user.user_id]}
                                    className={`p-1 rounded hover:bg-opacity-80 transition-colors ${
                                      user.suspended
                                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                                    }`}
                                    title={user.suspended ? 'Activează utilizatorul' : 'Suspendă utilizatorul'}
                                  >
                                    {isUpdatingStatus[user.user_id] ? (
                                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    ) : user.suspended ? (
                                      <CheckCircle className="h-4 w-4" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.user_id)}
                                    disabled={isDeleting[user.user_id]}
                                    className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                                    title="Șterge utilizatorul"
                                  >
                                    {isDeleting[user.user_id] ? (
                                      <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded Row */}
                            {expandedUser === user.id && (
                              <tr>
                                <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Detalii Utilizator</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-700 w-32">ID:</span>
                                          <span className="text-gray-900">{user.user_id}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-700 w-32">Nume:</span>
                                          <span className="text-gray-900">{user.name}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-700 w-32">Email:</span>
                                          <span className="text-gray-900">{user.email}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-700 w-32">Telefon:</span>
                                          <span className="text-gray-900">{user.phone || 'Nespecificat'}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-700 w-32">Locație:</span>
                                          <span className="text-gray-900">{user.location || 'Nespecificat'}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-700 w-32">Tip vânzător:</span>
                                          <span className="text-gray-900">{user.seller_type === 'dealer' ? 'Dealer' : 'Individual'}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-700 w-32">Verificat:</span>
                                          <span className="text-gray-900">{user.verified ? 'Da' : 'Nu'}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-gray-700 w-32">Admin:</span>
                                          <span className="text-gray-900">{user.is_admin ? 'Da' : 'Nu'}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Acțiuni</h4>
                                      <div className="space-y-3">
                                        <button
                                          onClick={() => handleToggleUserStatus(user.user_id, !user.suspended)}
                                          disabled={isUpdatingStatus[user.user_id]}
                                          className={`w-full px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 ${
                                            user.suspended
                                              ? 'bg-green-600 text-white hover:bg-green-700'
                                              : 'bg-red-600 text-white hover:bg-red-700'
                                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                          {isUpdatingStatus[user.user_id] ? (
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                          ) : user.suspended ? (
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                          ) : (
                                            <XCircle className="h-4 w-4 mr-1" />
                                          )}
                                          <span>{user.suspended ? 'Activează Utilizatorul' : 'Suspendă Utilizatorul'}</span>
                                        </button>
                                        
                                        <button
                                          onClick={() => navigate(`/profil/${user.user_id}`)}
                                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                        >
                                          <Eye className="h-4 w-4 mr-1" />
                                          <span>Vezi Profilul</span>
                                        </button>
                                        
                                        <button
                                          onClick={() => handleDeleteUser(user.user_id)}
                                          disabled={isDeleting[user.user_id]}
                                          className="w-full px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {isDeleting[user.user_id] ? (
                                            <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                                          ) : (
                                            <Trash2 className="h-4 w-4 mr-1" />
                                          )}
                                          <span>Șterge Utilizatorul</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {!isLoading && !error && activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Setări Platformă</h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 mb-2">Notă Importantă</h3>
                      <p className="text-yellow-700">
                        Această secțiune este în curs de dezvoltare. Setările platformei vor fi disponibile în curând.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Setări Generale</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numele Platformei
                        </label>
                        <input
                          type="text"
                          value="Nexar"
                          disabled
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 cursor-not-allowed"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Contact
                        </label>
                        <input
                          type="email"
                          value="contact@nexar.ro"
                          disabled
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 cursor-not-allowed"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Versiune Aplicație
                        </label>
                        <input
                          type="text"
                          value="1.0.0"
                          disabled
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Statistici</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{listings.length}</div>
                        <div className="text-sm text-blue-800">Anunțuri</div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{users.length}</div>
                        <div className="text-sm text-green-800">Utilizatori</div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {listings.filter(l => l.status === 'active').length}
                        </div>
                        <div className="text-sm text-purple-800">Anunțuri Active</div>
                      </div>
                      
                      <div className="bg-yellow-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {users.filter(u => u.seller_type === 'dealer').length}
                        </div>
                        <div className="text-sm text-yellow-800">Dealeri</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;