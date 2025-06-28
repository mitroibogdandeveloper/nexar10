import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Package, Settings, ChevronRight, Edit, Trash2, 
  CheckCircle, XCircle, Eye, AlertTriangle, Search, Filter,
  User, Building, Calendar, MapPin, ArrowUpDown, Check, X,
  RefreshCw, Shield
} from 'lucide-react';
import { admin, supabase, romanianCities } from '../lib/supabase';
import FixSupabaseButton from '../components/FixSupabaseButton';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('listings');
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sellerTypeFilter, setSellerTypeFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProcessing, setIsProcessing] = useState<{[key: string]: boolean}>({});
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
        await loadListings();
      } else {
        await loadUsers();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setError('A apărut o eroare la verificarea statusului de administrator');
      navigate('/');
    } finally {
      setIsLoading(false);
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
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
      console.error('Error in loadListings:', err);
      setError('A apărut o eroare la încărcarea anunțurilor');
    } finally {
      setIsLoading(false);
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
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
      console.error('Error in loadUsers:', err);
      setError('A apărut o eroare la încărcarea utilizatorilor');
    } finally {
      setIsLoading(false);
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    }
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
      console.error('Error in handleUpdateListingStatus:', err);
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
      
      alert('Anunțul a fost șters cu succes!');
    } catch (err) {
      console.error('Error in handleDeleteListing:', err);
      alert('A apărut o eroare la ștergerea anunțului');
    } finally {
      setIsProcessing(prev => ({ ...prev, [listingId]: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('ATENȚIE: Această acțiune va șterge utilizatorul și toate anunțurile sale. Ești sigur că vrei să continui?')) return;
    
    try {
      setIsProcessing(prev => ({ ...prev, [userId]: true }));
      
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
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('Error deleting user profile:', deleteError);
        alert(`Eroare la ștergerea profilului utilizatorului: ${deleteError.message}`);
        return;
      }
      
      // Eliminăm utilizatorul din listă
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      
      alert('Utilizatorul și toate anunțurile sale au fost șterse cu succes!');
      
      // Reîncărcăm anunțurile pentru a reflecta schimbările
      loadListings();
    } catch (err) {
      console.error('Error in handleDeleteUser:', err);
      alert('A apărut o eroare la ștergerea utilizatorului');
    } finally {
      setIsProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Filtrare și sortare pentru anunțuri
  const filteredListings = listings.filter(listing => {
    // Filtrare după text
    const matchesSearch = 
      searchQuery === '' || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtrare după status
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    
    // Filtrare după tip vânzător
    const matchesSellerType = sellerTypeFilter === 'all' || listing.seller_type === sellerTypeFilter;
    
    return matchesSearch && matchesStatus && matchesSellerType;
  }).sort((a, b) => {
    // Sortare
    if (sortField === 'price') {
      return sortDirection === 'asc' ? a.price - b.price : b.price - a.price;
    } else if (sortField === 'created_at') {
      return sortDirection === 'asc' 
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  // Filtrare pentru utilizatori
  const filteredUsers = users.filter(user => 
    searchQuery === '' || 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Funcție pentru a formata data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funcție pentru a obține clasa de culoare pentru status
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Funcție pentru a obține textul pentru status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activ';
      case 'pending':
        return 'În așteptare';
      case 'sold':
        return 'Vândut';
      case 'rejected':
        return 'Respins';
      default:
        return status;
    }
  };

  if (!isAdmin && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acces Interzis</h2>
          <p className="text-gray-600 mb-6">Nu ai permisiunea de a accesa această pagină. Doar administratorii pot vedea panoul de administrare.</p>
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
              onClick={() => setActiveTab('listings')}
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
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'text-nexar-accent border-b-2 border-nexar-accent'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Gestionare Utilizatori</span>
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
            {error && !isLoading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <div>
                    <h3 className="font-semibold text-red-800">Eroare</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => activeTab === 'listings' ? loadListings() : loadUsers()}
                    className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Încearcă din nou</span>
                  </button>
                  <FixSupabaseButton buttonText="Repară Conexiunea" />
                </div>
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && !isLoading && !error && (
              <div>
                {/* Filters */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    {/* Search */}
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Caută după titlu, vânzător sau locație..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="w-full md:w-48">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                      >
                        <option value="all">Toate statusurile</option>
                        <option value="active">Active</option>
                        <option value="pending">În așteptare</option>
                        <option value="sold">Vândute</option>
                        <option value="rejected">Respinse</option>
                      </select>
                    </div>

                    {/* Seller Type Filter */}
                    <div className="w-full md:w-48">
                      <select
                        value={sellerTypeFilter}
                        onChange={(e) => setSellerTypeFilter(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                      >
                        <option value="all">Toți vânzătorii</option>
                        <option value="individual">Vânzător Individual</option>
                        <option value="dealer">Dealer Autorizat</option>
                      </select>
                    </div>

                    {/* Sort */}
                    <div className="w-full md:w-48">
                      <select
                        value={`${sortField}-${sortDirection}`}
                        onChange={(e) => {
                          const [field, direction] = e.target.value.split('-');
                          setSortField(field);
                          setSortDirection(direction);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                      >
                        <option value="created_at-desc">Cele mai noi</option>
                        <option value="created_at-asc">Cele mai vechi</option>
                        <option value="price-desc">Preț: Descrescător</option>
                        <option value="price-asc">Preț: Crescător</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Listings Table */}
                {filteredListings.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nu există anunțuri</h3>
                    <p className="text-gray-600">Nu am găsit anunțuri care să corespundă criteriilor de căutare.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Anunț
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vânzător
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Preț
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acțiuni
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredListings.map((listing) => (
                          <tr key={listing.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
                                  <img 
                                    src={listing.images && listing.images[0] ? listing.images[0] : "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg"} 
                                    alt={listing.title}
                                    className="h-10 w-10 object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.src = "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg";
                                    }}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                    {listing.title}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {listing.location}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {listing.seller_type === 'dealer' ? (
                                  <div className="flex items-center space-x-1">
                                    <Building className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm font-medium text-gray-900">{listing.seller_name}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <User className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900">{listing.seller_name}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">€{listing.price.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(listing.status)}`}>
                                {getStatusText(listing.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(listing.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => window.open(`/anunt/${listing.id}`, '_blank')}
                                  className="text-gray-600 hover:text-gray-900 transition-colors"
                                  title="Vezi anunțul"
                                >
                                  <Eye className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => navigate(`/editeaza-anunt/${listing.id}`)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Editează anunțul"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  disabled={isProcessing[listing.id]}
                                  className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Șterge anunțul"
                                >
                                  {isProcessing[listing.id] ? (
                                    <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Trash2 className="h-5 w-5" />
                                  )}
                                </button>
                                
                                {/* Status Update Dropdown */}
                                <div className="relative inline-block text-left">
                                  <select
                                    value={listing.status}
                                    onChange={(e) => handleUpdateListingStatus(listing.id, e.target.value)}
                                    disabled={isProcessing[listing.id]}
                                    className="border border-gray-300 rounded-md text-sm py-1 pl-2 pr-8 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-nexar-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <option value="active">Activ</option>
                                    <option value="pending">În așteptare</option>
                                    <option value="sold">Vândut</option>
                                    <option value="rejected">Respins</option>
                                  </select>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && !isLoading && !error && (
              <div>
                {/* Filters */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    {/* Search */}
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Caută după nume, email sau locație..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      </div>
                    </div>

                    {/* Seller Type Filter */}
                    <div className="w-full md:w-48">
                      <select
                        value={sellerTypeFilter}
                        onChange={(e) => setSellerTypeFilter(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                      >
                        <option value="all">Toți utilizatorii</option>
                        <option value="individual">Vânzători Individuali</option>
                        <option value="dealer">Dealeri Autorizați</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nu există utilizatori</h3>
                    <p className="text-gray-600">Nu am găsit utilizatori care să corespundă criteriilor de căutare.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Utilizator
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tip
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data înregistrării
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acțiuni
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                  {user.avatar_url ? (
                                    <img 
                                      src={user.avatar_url} 
                                      alt={user.name}
                                      className="h-10 w-10 object-cover"
                                      onError={(e) => {
                                        const target = e.currentTarget as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.parentElement!.innerHTML = user.name.charAt(0).toUpperCase();
                                      }}
                                    />
                                  ) : (
                                    <span className="text-lg font-semibold text-gray-700">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.name}
                                    {user.is_admin && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {user.location || 'Locație nespecificată'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.email}</div>
                              <div className="text-sm text-gray-500">{user.phone || 'Telefon nespecificat'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.seller_type === 'dealer' ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                  Dealer
                                </span>
                              ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Individual
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => navigate(`/profil/${user.id}`)}
                                  className="text-gray-600 hover:text-gray-900 transition-colors"
                                  title="Vezi profilul"
                                >
                                  <Eye className="h-5 w-5" />
                                </button>
                                
                                {!user.is_admin && (
                                  <button
                                    onClick={() => handleDeleteUser(user.user_id)}
                                    disabled={isProcessing[user.user_id]}
                                    className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Șterge utilizatorul"
                                  >
                                    {isProcessing[user.user_id] ? (
                                      <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Trash2 className="h-5 w-5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;