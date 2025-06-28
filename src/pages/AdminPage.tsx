import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Package, Settings, Search, Filter, 
  ChevronDown, ChevronUp, Edit, Trash2, Eye, 
  CheckCircle, XCircle, AlertTriangle, User,
  Mail, Phone, MapPin, Calendar, Clock, Shield,
  Building, Ban, Check, X, RefreshCw
} from 'lucide-react';
import { supabase, admin } from '../lib/supabase';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('listings');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<{field: string, direction: 'asc' | 'desc'}>({
    field: 'created_at',
    direction: 'desc'
  });
  const [isProcessing, setIsProcessing] = useState<{[key: string]: boolean}>({});
  const [expandedListings, setExpandedListings] = useState<{[key: string]: boolean}>({});
  const [expandedUsers, setExpandedUsers] = useState<{[key: string]: boolean}>({});
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
    
    checkAdminAndLoadData();
    
    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificăm dacă utilizatorul este admin
      const isAdminUser = await admin.isAdmin();
      
      if (!isAdminUser) {
        console.error('Unauthorized access attempt to admin page');
        navigate('/');
        return;
      }
      
      setIsAdmin(true);
      
      // Încărcăm datele în funcție de tab-ul activ
      if (activeTab === 'listings') {
        await loadListings();
      } else if (activeTab === 'users') {
        await loadUsers();
      }
      
    } catch (err) {
      console.error('Error in admin page:', err);
      setError('A apărut o eroare la încărcarea datelor. Te rugăm să încerci din nou.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadListings = async () => {
    try {
      console.log('🔄 Loading all listings for admin...');
      
      const { data, error } = await admin.getAllListings();
      
      if (error) {
        console.error('❌ Error loading listings:', error);
        throw new Error('Nu s-au putut încărca anunțurile');
      }
      
      console.log(`✅ Loaded ${data?.length || 0} listings`);
      setListings(data || []);
      
    } catch (err) {
      console.error('Error loading listings:', err);
      setError('Nu s-au putut încărca anunțurile');
    }
  };

  const loadUsers = async () => {
    try {
      console.log('🔄 Loading all users for admin...');
      
      const { data, error } = await admin.getAllUsers();
      
      if (error) {
        console.error('❌ Error loading users:', error);
        throw new Error('Nu s-au putut încărca utilizatorii');
      }
      
      console.log(`✅ Loaded ${data?.length || 0} users`);
      setUsers(data || []);
      
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Nu s-au putut încărca utilizatorii');
    }
  };

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    setIsLoading(true);
    setError(null);
    
    try {
      if (tab === 'listings') {
        await loadListings();
      } else if (tab === 'users') {
        await loadUsers();
      }
    } catch (err) {
      console.error(`Error loading ${tab}:`, err);
      setError(`Nu s-au putut încărca ${tab === 'listings' ? 'anunțurile' : 'utilizatorii'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    setSortOrder(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleUpdateListingStatus = async (listingId: string, status: string) => {
    try {
      setIsProcessing(prev => ({ ...prev, [listingId]: true }));
      
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
      alert('A apărut o eroare la actualizarea statusului');
    } finally {
      setIsProcessing(prev => ({ ...prev, [listingId]: false }));
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest anunț?')) return;
    
    try {
      setIsProcessing(prev => ({ ...prev, [listingId]: true }));
      
      const { error } = await admin.deleteListing(listingId);
      
      if (error) {
        console.error('Error deleting listing:', error);
        alert(`Eroare la ștergerea anunțului: ${error.message}`);
        return;
      }
      
      // Eliminăm anunțul din listă
      setListings(prev => prev.filter(listing => listing.id !== listingId));
      
      alert('Anunțul a fost șters cu succes');
      
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert('A apărut o eroare la ștergerea anunțului');
    } finally {
      setIsProcessing(prev => ({ ...prev, [listingId]: false }));
    }
  };

  const handleToggleUserStatus = async (userId: string, suspended: boolean) => {
    try {
      setIsProcessing(prev => ({ ...prev, [userId]: true }));
      
      const { error } = await admin.toggleUserStatus(userId, suspended);
      
      if (error) {
        console.error('Error toggling user status:', error);
        alert(`Eroare la ${suspended ? 'suspendarea' : 'activarea'} utilizatorului: ${error.message}`);
        return;
      }
      
      // Actualizăm lista de utilizatori
      setUsers(prev => 
        prev.map(user => 
          user.user_id === userId ? { ...user, suspended } : user
        )
      );
      
      alert(`Utilizatorul a fost ${suspended ? 'suspendat' : 'activat'} cu succes`);
      
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert('A apărut o eroare la actualizarea statusului utilizatorului');
    } finally {
      setIsProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('ATENȚIE: Această acțiune va șterge utilizatorul și TOATE anunțurile sale. Ești sigur că vrei să continui?')) return;
    
    try {
      setIsProcessing(prev => ({ ...prev, [userId]: true }));
      
      // Implementăm ștergerea utilizatorului
      console.log('🗑️ Deleting user:', userId);
      
      // Obținem profilul utilizatorului pentru a avea seller_id
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
      
      if (!profile) {
        alert('Profilul utilizatorului nu a fost găsit');
        return;
      }
      
      // Ștergem toate anunțurile utilizatorului
      console.log('🗑️ Deleting all listings for user with profile ID:', profile.id);
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
      console.log('🗑️ Deleting user profile');
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (deleteProfileError) {
        console.error('Error deleting user profile:', deleteProfileError);
        alert(`Eroare la ștergerea profilului utilizatorului: ${deleteProfileError.message}`);
        return;
      }
      
      // Încercăm să ștergem utilizatorul din auth (poate să nu funcționeze fără drepturi de admin)
      try {
        console.log('🗑️ Attempting to delete auth user');
        await supabase.auth.admin.deleteUser(userId);
      } catch (authError) {
        console.warn('Could not delete auth user (requires admin rights):', authError);
      }
      
      // Eliminăm utilizatorul din listă
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      
      alert('Utilizatorul și toate anunțurile sale au fost șterse cu succes');
      
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('A apărut o eroare la ștergerea utilizatorului');
    } finally {
      setIsProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleEditListing = (listingId: string) => {
    navigate(`/editeaza-anunt/${listingId}`);
  };

  const handleViewListing = (listingId: string) => {
    navigate(`/anunt/${listingId}`);
  };

  const handleViewUser = (userId: string) => {
    navigate(`/profil/${userId}`);
  };

  const toggleListingExpand = (listingId: string) => {
    setExpandedListings(prev => ({
      ...prev,
      [listingId]: !prev[listingId]
    }));
  };

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Filtrare și sortare pentru anunțuri
  const filteredListings = listings.filter(listing => {
    // Filtrare după status
    if (statusFilter !== 'all' && listing.status !== statusFilter) {
      return false;
    }
    
    // Căutare în text
    const searchLower = searchQuery.toLowerCase();
    return !searchQuery || 
      listing.title.toLowerCase().includes(searchLower) ||
      listing.seller_name.toLowerCase().includes(searchLower) ||
      listing.location.toLowerCase().includes(searchLower) ||
      listing.brand.toLowerCase().includes(searchLower) ||
      listing.model.toLowerCase().includes(searchLower);
  });
  
  // Sortare anunțuri
  const sortedListings = [...filteredListings].sort((a, b) => {
    const field = sortOrder.field;
    const direction = sortOrder.direction === 'asc' ? 1 : -1;
    
    if (field === 'created_at' || field === 'updated_at') {
      return direction * (new Date(a[field]).getTime() - new Date(b[field]).getTime());
    }
    
    if (field === 'price') {
      return direction * (a[field] - b[field]);
    }
    
    if (typeof a[field] === 'string' && typeof b[field] === 'string') {
      return direction * a[field].localeCompare(b[field]);
    }
    
    return 0;
  });
  
  // Filtrare și sortare pentru utilizatori
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return !searchQuery || 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.phone && user.phone.toLowerCase().includes(searchLower)) ||
      (user.location && user.location.toLowerCase().includes(searchLower));
  });
  
  // Sortare utilizatori
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const field = sortOrder.field;
    const direction = sortOrder.direction === 'asc' ? 1 : -1;
    
    if (field === 'created_at') {
      return direction * (new Date(a[field]).getTime() - new Date(b[field]).getTime());
    }
    
    if (typeof a[field] === 'string' && typeof b[field] === 'string') {
      return direction * a[field].localeCompare(b[field]);
    }
    
    return 0;
  });

  // Dacă utilizatorul nu este admin, nu afișăm nimic
  if (!isAdmin && !isLoading) {
    navigate('/');
    return null;
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
              <span>Gestionare Anunțuri</span>
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
              <span>Gestionare Utilizatori</span>
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
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-nexar-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Se încarcă panoul de administrare...</p>
              </div>
            )}
            
            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-2">Eroare</h3>
                    <p className="text-red-700">{error}</p>
                    <button
                      onClick={checkAdminAndLoadData}
                      className="mt-2 flex items-center space-x-2 text-red-700 hover:text-red-900 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Încearcă din nou</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Listings Tab */}
            {activeTab === 'listings' && !isLoading && !error && (
              <div>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <h2 className="text-xl font-semibold text-gray-900">Gestionare Anunțuri</h2>
                  
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    {/* Search */}
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Caută anunțuri..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    </div>
                    
                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Anunț
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('price')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Preț</span>
                            {sortOrder.field === 'price' && (
                              sortOrder.direction === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Status</span>
                            {sortOrder.field === 'status' && (
                              sortOrder.direction === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Data</span>
                            {sortOrder.field === 'created_at' && (
                              sortOrder.direction === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acțiuni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedListings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            Nu s-au găsit anunțuri care să corespundă criteriilor de căutare
                          </td>
                        </tr>
                      ) : (
                        sortedListings.map(listing => (
                          <React.Fragment key={listing.id}>
                            <tr className={`hover:bg-gray-50 ${expandedListings[listing.id] ? 'bg-gray-50' : ''}`}>
                              <td className="px-4 py-4">
                                <div className="flex items-start space-x-3">
                                  <img 
                                    src={listing.images && listing.images[0] ? listing.images[0] : "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg"}
                                    alt={listing.title}
                                    className="w-12 h-12 object-cover rounded-lg"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.src = "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg";
                                    }}
                                  />
                                  <div>
                                    <div className="font-semibold text-gray-900">{listing.title}</div>
                                    <div className="text-sm text-gray-500">
                                      {listing.brand} {listing.model}, {listing.year}
                                    </div>
                                    <button
                                      onClick={() => toggleListingExpand(listing.id)}
                                      className="text-xs text-nexar-accent hover:text-nexar-gold transition-colors mt-1 flex items-center"
                                    >
                                      {expandedListings[listing.id] ? (
                                        <>
                                          <ChevronUp className="h-3 w-3 mr-1" />
                                          <span>Ascunde detalii</span>
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="h-3 w-3 mr-1" />
                                          <span>Vezi detalii</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-semibold text-gray-900">€{listing.price.toLocaleString()}</div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
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
                              <td className="px-4 py-4 text-sm text-gray-500">
                                {new Date(listing.created_at).toLocaleDateString('ro-RO')}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleViewListing(listing.id)}
                                    className="p-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                    title="Vezi anunțul"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditListing(listing.id)}
                                    className="p-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                    title="Editează anunțul"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteListing(listing.id)}
                                    disabled={isProcessing[listing.id]}
                                    className="p-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Șterge anunțul"
                                  >
                                    {isProcessing[listing.id] ? (
                                      <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded Details */}
                            {expandedListings[listing.id] && (
                              <tr>
                                <td colSpan={5} className="px-4 py-4 bg-gray-50">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Detalii anunț</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-start space-x-2">
                                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <div>
                                            <div className="font-medium">Locație</div>
                                            <div>{listing.location}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                          <Settings className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <div>
                                            <div className="font-medium">Specificații</div>
                                            <div>{listing.engine_capacity}cc, {listing.fuel_type}, {listing.transmission}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                          <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <div>
                                            <div className="font-medium">Creat la</div>
                                            <div>{new Date(listing.created_at).toLocaleString('ro-RO')}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                          <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <div>
                                            <div className="font-medium">Actualizat la</div>
                                            <div>{new Date(listing.updated_at).toLocaleString('ro-RO')}</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Informații vânzător</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-start space-x-2">
                                          <User className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <div>
                                            <div className="font-medium">Nume</div>
                                            <div>{listing.seller_name}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                          <Building className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <div>
                                            <div className="font-medium">Tip vânzător</div>
                                            <div>{listing.seller_type === 'dealer' ? 'Dealer Autorizat' : 'Vânzător Privat'}</div>
                                          </div>
                                        </div>
                                        {listing.profiles && (
                                          <>
                                            <div className="flex items-start space-x-2">
                                              <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                                              <div>
                                                <div className="font-medium">Email</div>
                                                <div>{listing.profiles.email}</div>
                                              </div>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                              <Shield className="h-4 w-4 text-gray-500 mt-0.5" />
                                              <div>
                                                <div className="font-medium">Verificat</div>
                                                <div>{listing.profiles.verified ? 'Da' : 'Nu'}</div>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      
                                      <div className="mt-4 space-x-2">
                                        <button
                                          onClick={() => handleUpdateListingStatus(listing.id, 'active')}
                                          disabled={listing.status === 'active' || isProcessing[listing.id]}
                                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Activează
                                        </button>
                                        <button
                                          onClick={() => handleUpdateListingStatus(listing.id, 'pending')}
                                          disabled={listing.status === 'pending' || isProcessing[listing.id]}
                                          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          În așteptare
                                        </button>
                                        <button
                                          onClick={() => handleUpdateListingStatus(listing.id, 'rejected')}
                                          disabled={listing.status === 'rejected' || isProcessing[listing.id]}
                                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Respinge
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
            
            {/* Users Tab */}
            {activeTab === 'users' && !isLoading && !error && (
              <div>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <h2 className="text-xl font-semibold text-gray-900">Gestionare Utilizatori</h2>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Caută utilizatori..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  </div>
                </div>
                
                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilizator
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tip
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Înregistrat</span>
                            {sortOrder.field === 'created_at' && (
                              sortOrder.direction === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acțiuni
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            Nu s-au găsit utilizatori care să corespundă criteriilor de căutare
                          </td>
                        </tr>
                      ) : (
                        sortedUsers.map(user => (
                          <React.Fragment key={user.user_id}>
                            <tr className={`hover:bg-gray-50 ${expandedUsers[user.user_id] ? 'bg-gray-50' : ''}`}>
                              <td className="px-4 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    {user.avatar_url ? (
                                      <img 
                                        src={user.avatar_url} 
                                        alt={user.name} 
                                        className="w-10 h-10 rounded-full object-cover"
                                        onError={(e) => {
                                          const target = e.currentTarget as HTMLImageElement;
                                          target.style.display = 'none';
                                          target.parentElement!.innerHTML = user.name.charAt(0).toUpperCase();
                                        }}
                                      />
                                    ) : (
                                      <span className="text-gray-600 font-semibold">{user.name.charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                    <button
                                      onClick={() => toggleUserExpand(user.user_id)}
                                      className="text-xs text-nexar-accent hover:text-nexar-gold transition-colors mt-1 flex items-center"
                                    >
                                      {expandedUsers[user.user_id] ? (
                                        <>
                                          <ChevronUp className="h-3 w-3 mr-1" />
                                          <span>Ascunde detalii</span>
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="h-3 w-3 mr-1" />
                                          <span>Vezi detalii</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  user.seller_type === 'dealer' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {user.seller_type === 'dealer' ? 'Dealer' : 'Individual'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-500">
                                {new Date(user.created_at).toLocaleDateString('ro-RO')}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  user.suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.suspended ? 'Suspendat' : 'Activ'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleViewUser(user.id)}
                                    className="p-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                    title="Vezi profilul"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleUserStatus(user.user_id, !user.suspended)}
                                    disabled={isProcessing[user.user_id]}
                                    className={`p-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                      user.suspended 
                                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                        : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                                    }`}
                                    title={user.suspended ? 'Activează utilizatorul' : 'Suspendă utilizatorul'}
                                  >
                                    {isProcessing[user.user_id] ? (
                                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    ) : user.suspended ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Ban className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.user_id)}
                                    disabled={isProcessing[user.user_id] || user.is_admin}
                                    className="p-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={user.is_admin ? 'Nu poți șterge un administrator' : 'Șterge utilizatorul'}
                                  >
                                    {isProcessing[user.user_id] ? (
                                      <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded Details */}
                            {expandedUsers[user.user_id] && (
                              <tr>
                                <td colSpan={5} className="px-4 py-4 bg-gray-50">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Detalii utilizator</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-start space-x-2">
                                          <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <div>
                                            <div className="font-medium">Telefon</div>
                                            <div>{user.phone || 'Nespecificat'}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <div>
                                            <div className="font-medium">Locație</div>
                                            <div>{user.location || 'Nespecificat'}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                          <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <div>
                                            <div className="font-medium">Înregistrat la</div>
                                            <div>{new Date(user.created_at).toLocaleString('ro-RO')}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                          <Shield className="h-4 w-4 text-gray-500 mt-0.5" />
                                          <div>
                                            <div className="font-medium">Verificat</div>
                                            <div>{user.verified ? 'Da' : 'Nu'}</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold text-gray-900 mb-2">Acțiuni</h4>
                                      <div className="space-y-2">
                                        <button
                                          onClick={() => handleToggleUserStatus(user.user_id, !user.suspended)}
                                          disabled={isProcessing[user.user_id]}
                                          className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                            user.suspended 
                                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                          }`}
                                        >
                                          {isProcessing[user.user_id] ? (
                                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                          ) : user.suspended ? (
                                            <>
                                              <Check className="h-4 w-4" />
                                              <span>Activează utilizatorul</span>
                                            </>
                                          ) : (
                                            <>
                                              <Ban className="h-4 w-4" />
                                              <span>Suspendă utilizatorul</span>
                                            </>
                                          )}
                                        </button>
                                        
                                        <button
                                          onClick={() => handleDeleteUser(user.user_id)}
                                          disabled={isProcessing[user.user_id] || user.is_admin}
                                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {isProcessing[user.user_id] ? (
                                            <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                          ) : (
                                            <>
                                              <Trash2 className="h-4 w-4" />
                                              <span>{user.is_admin ? 'Nu poți șterge un administrator' : 'Șterge utilizatorul și anunțurile'}</span>
                                            </>
                                          )}
                                        </button>
                                        
                                        <button
                                          onClick={() => handleViewUser(user.id)}
                                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                        >
                                          <Eye className="h-4 w-4" />
                                          <span>Vezi profilul complet</span>
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
            {activeTab === 'settings' && !isLoading && !error && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Setări Platformă</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistici Platformă</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-nexar-accent">{listings.length}</div>
                        <div className="text-sm text-gray-600">Anunțuri totale</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-nexar-accent">{users.length}</div>
                        <div className="text-sm text-gray-600">Utilizatori înregistrați</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-nexar-accent">
                          {listings.filter(l => l.status === 'active').length}
                        </div>
                        <div className="text-sm text-gray-600">Anunțuri active</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-nexar-accent">
                          {listings.filter(l => l.status === 'sold').length}
                        </div>
                        <div className="text-sm text-gray-600">Anunțuri vândute</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Acțiuni Rapide</h3>
                    
                    <div className="space-y-4">
                      <button
                        onClick={loadListings}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-nexar-accent text-white rounded-lg font-semibold hover:bg-nexar-gold transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Reîmprospătează Anunțurile</span>
                      </button>
                      
                      <button
                        onClick={loadUsers}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Reîmprospătează Utilizatorii</span>
                      </button>
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