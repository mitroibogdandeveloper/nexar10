import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Package, BarChart3, Settings, 
  CheckCircle, XCircle, Trash2, Edit, Eye, 
  AlertTriangle, Search, Filter, ChevronDown, ChevronUp,
  User, Mail, Phone, MapPin, Calendar, Clock, Ban, 
  RefreshCw, Shield, Building
} from 'lucide-react';
import { admin, supabase } from '../lib/supabase';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<{field: string, direction: 'asc' | 'desc'}>({
    field: 'created_at',
    direction: 'desc'
  });
  const [isProcessing, setIsProcessing] = useState<{[key: string]: boolean}>({});
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
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

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'listings') {
        loadListings();
      } else if (activeTab === 'users') {
        loadUsers();
      }
    }
  }, [isAdmin, activeTab]);

  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const isAdminUser = await admin.isAdmin();
      
      if (!isAdminUser) {
        setError('Acces interzis. Trebuie să fii administrator pentru a accesa această pagină.');
        setIsAdmin(false);
        return;
      }
      
      setIsAdmin(true);
      
      // Încărcăm datele pentru tab-ul activ
      if (activeTab === 'listings') {
        await loadListings();
      } else if (activeTab === 'users') {
        await loadUsers();
      }
      
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError('A apărut o eroare la verificarea statutului de administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadListings = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await admin.getAllListings();
      
      if (error) {
        console.error('Error loading listings:', error);
        setError('A apărut o eroare la încărcarea anunțurilor.');
        return;
      }
      
      setListings(data || []);
    } catch (err) {
      console.error('Error in loadListings:', err);
      setError('A apărut o eroare la încărcarea anunțurilor.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await admin.getAllUsers();
      
      if (error) {
        console.error('Error loading users:', error);
        setError('A apărut o eroare la încărcarea utilizatorilor.');
        return;
      }
      
      setUsers(data || []);
    } catch (err) {
      console.error('Error in loadUsers:', err);
      setError('A apărut o eroare la încărcarea utilizatorilor.');
    } finally {
      setIsLoading(false);
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
      
    } catch (err) {
      console.error('Error updating listing status:', err);
      alert('A apărut o eroare la actualizarea statusului.');
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
      
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert('A apărut o eroare la ștergerea anunțului.');
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
        alert(`Eroare la actualizarea statusului utilizatorului: ${error.message}`);
        return;
      }
      
      // Actualizăm lista de utilizatori
      setUsers(prev => 
        prev.map(user => 
          user.user_id === userId ? { ...user, suspended } : user
        )
      );
      
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert('A apărut o eroare la actualizarea statusului utilizatorului.');
    } finally {
      setIsProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Ești sigur că vrei să ștergi acest utilizator? Toate anunțurile sale vor fi șterse.')) return;
    
    try {
      setIsProcessing(prev => ({ ...prev, [userId]: true }));
      
      // Implementăm ștergerea utilizatorului și a anunțurilor sale
      const { error } = await admin.deleteUser(userId);
      
      if (error) {
        console.error('Error deleting user:', error);
        alert(`Eroare la ștergerea utilizatorului: ${error.message}`);
        return;
      }
      
      // Eliminăm utilizatorul din listă
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      
      // Reîncărcăm și anunțurile pentru a reflecta schimbările
      if (activeTab === 'listings') {
        loadListings();
      }
      
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('A apărut o eroare la ștergerea utilizatorului.');
    } finally {
      setIsProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleSort = (field: string) => {
    setSortOrder(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Filtrare și sortare anunțuri
  const filteredListings = listings
    .filter(listing => {
      // Filtrare după status
      if (statusFilter !== 'all' && listing.status !== statusFilter) {
        return false;
      }
      
      // Căutare în text
      const searchLower = searchQuery.toLowerCase();
      return !searchQuery || 
        listing.title.toLowerCase().includes(searchLower) ||
        listing.seller_name.toLowerCase().includes(searchLower) ||
        listing.id.toLowerCase().includes(searchLower) ||
        (listing.description && listing.description.toLowerCase().includes(searchLower));
    })
    .sort((a, b) => {
      // Sortare
      const field = sortOrder.field;
      const direction = sortOrder.direction === 'asc' ? 1 : -1;
      
      if (field === 'price') {
        return (a.price - b.price) * direction;
      } else if (field === 'created_at') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
      } else if (field === 'title') {
        return a.title.localeCompare(b.title) * direction;
      } else if (field === 'seller_name') {
        return a.seller_name.localeCompare(b.seller_name) * direction;
      }
      
      return 0;
    });

  // Filtrare și sortare utilizatori
  const filteredUsers = users
    .filter(user => {
      // Filtrare după tip utilizator
      if (userTypeFilter === 'dealer' && user.seller_type !== 'dealer') {
        return false;
      } else if (userTypeFilter === 'individual' && user.seller_type !== 'individual') {
        return false;
      } else if (userTypeFilter === 'suspended' && !user.suspended) {
        return false;
      }
      
      // Căutare în text
      const searchLower = userSearchQuery.toLowerCase();
      return !userSearchQuery || 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone && user.phone.toLowerCase().includes(searchLower)) ||
        (user.location && user.location.toLowerCase().includes(searchLower));
    })
    .sort((a, b) => {
      // Sortare implicită după data creării (cei mai noi primii)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Formatare dată
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

  // Dacă nu este admin, afișăm mesaj de acces interzis
  if (!isLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acces Interzis</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Trebuie să fii administrator pentru a accesa această pagină.'}
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 text-white p-6">
            <h1 className="text-2xl font-bold flex items-center">
              <Settings className="h-6 w-6 mr-2" />
              Panou de Administrare
            </h1>
            <p className="text-gray-300 mt-1">
              Gestionează anunțurile, utilizatorii și setările platformei
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-nexar-accent border-b-2 border-nexar-accent'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
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
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
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
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistici Generale</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 font-medium">Total Anunțuri</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{listings.length}</p>
                      </div>
                      <Package className="h-10 w-10 text-blue-500" />
                    </div>
                    <div className="mt-4 text-sm text-blue-600">
                      <span className="font-medium">{listings.filter(l => l.status === 'active').length}</span> anunțuri active
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 font-medium">Total Utilizatori</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
                      </div>
                      <Users className="h-10 w-10 text-green-500" />
                    </div>
                    <div className="mt-4 text-sm text-green-600">
                      <span className="font-medium">{users.filter(u => u.seller_type === 'dealer').length}</span> dealeri,{' '}
                      <span className="font-medium">{users.filter(u => u.seller_type === 'individual').length}</span> individuali
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 font-medium">Activitate Recentă</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {listings.filter(l => {
                            const date = new Date(l.created_at);
                            const now = new Date();
                            const diffTime = Math.abs(now.getTime() - date.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return diffDays <= 7;
                          }).length}
                        </p>
                      </div>
                      <Clock className="h-10 w-10 text-purple-500" />
                    </div>
                    <div className="mt-4 text-sm text-purple-600">
                      Anunțuri noi în ultimele 7 zile
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Anunțuri Recente</h3>
                  
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Titlu
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Vânzător
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Preț
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {listings.slice(0, 5).map((listing) => (
                            <tr key={listing.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{listing.seller_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">€{listing.price.toLocaleString()}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(listing.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilizatori Recenți</h3>
                  
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nume
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tip
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Locație
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data Înregistrării
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.slice(0, 5).map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    {user.avatar_url ? (
                                      <img src={user.avatar_url} alt={user.name} className="h-8 w-8 rounded-full" />
                                    ) : (
                                      <span className="text-sm font-medium text-gray-500">
                                        {user.name.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.seller_type === 'dealer' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {user.seller_type === 'dealer' ? 'Dealer' : 'Individual'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.location || 'Nespecificat'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(user.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Listings Management Tab */}
            {activeTab === 'listings' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Gestionare Anunțuri</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Caută anunțuri..."
                        className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    </div>
                    
                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    >
                      <option value="all">Toate statusurile</option>
                      <option value="active">Active</option>
                      <option value="pending">În așteptare</option>
                      <option value="sold">Vândute</option>
                      <option value="rejected">Respinse</option>
                    </select>
                    
                    {/* Refresh Button */}
                    <button
                      onClick={loadListings}
                      className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Reîmprospătează</span>
                    </button>
                  </div>
                </div>
                
                {/* Listings Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button 
                              onClick={() => handleSort('title')}
                              className="flex items-center space-x-1 hover:text-gray-700"
                            >
                              <span>Titlu</span>
                              {sortOrder.field === 'title' && (
                                sortOrder.direction === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button 
                              onClick={() => handleSort('seller_name')}
                              className="flex items-center space-x-1 hover:text-gray-700"
                            >
                              <span>Vânzător</span>
                              {sortOrder.field === 'seller_name' && (
                                sortOrder.direction === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button 
                              onClick={() => handleSort('price')}
                              className="flex items-center space-x-1 hover:text-gray-700"
                            >
                              <span>Preț</span>
                              {sortOrder.field === 'price' && (
                                sortOrder.direction === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button 
                              onClick={() => handleSort('created_at')}
                              className="flex items-center space-x-1 hover:text-gray-700"
                            >
                              <span>Data</span>
                              {sortOrder.field === 'created_at' && (
                                sortOrder.direction === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acțiuni
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredListings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                              Nu s-au găsit anunțuri care să corespundă criteriilor de căutare.
                            </td>
                          </tr>
                        ) : (
                          filteredListings.map((listing) => (
                            <tr key={listing.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
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
                                    <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                                    <div className="text-xs text-gray-500">{listing.brand} {listing.model}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="text-sm text-gray-900">{listing.seller_name}</div>
                                  {listing.seller_type === 'dealer' && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                      <Building className="h-3 w-3 mr-1" />
                                      Dealer
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">€{listing.price.toLocaleString()}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(listing.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => navigate(`/anunt/${listing.id}`)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Vezi anunțul"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => navigate(`/editeaza-anunt/${listing.id}`)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    title="Editează anunțul"
                                  >
                                    <Edit className="h-5 w-5" />
                                  </button>
                                  {listing.status !== 'active' && (
                                    <button
                                      onClick={() => handleUpdateListingStatus(listing.id, 'active')}
                                      disabled={isProcessing[listing.id]}
                                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                      title="Aprobă anunțul"
                                    >
                                      {isProcessing[listing.id] ? (
                                        <div className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <CheckCircle className="h-5 w-5" />
                                      )}
                                    </button>
                                  )}
                                  {listing.status !== 'rejected' && (
                                    <button
                                      onClick={() => handleUpdateListingStatus(listing.id, 'rejected')}
                                      disabled={isProcessing[listing.id]}
                                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                      title="Respinge anunțul"
                                    >
                                      {isProcessing[listing.id] ? (
                                        <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <XCircle className="h-5 w-5" />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteListing(listing.id)}
                                    disabled={isProcessing[listing.id]}
                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                    title="Șterge anunțul"
                                  >
                                    {isProcessing[listing.id] ? (
                                      <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
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

            {/* Users Management Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Gestionare Utilizatori</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="relative">
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Caută utilizatori..."
                        className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    </div>
                    
                    {/* User Type Filter */}
                    <select
                      value={userTypeFilter}
                      onChange={(e) => setUserTypeFilter(e.target.value)}
                      className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                    >
                      <option value="all">Toți utilizatorii</option>
                      <option value="dealer">Dealeri</option>
                      <option value="individual">Individuali</option>
                      <option value="suspended">Suspendați</option>
                    </select>
                    
                    {/* Refresh Button */}
                    <button
                      onClick={loadUsers}
                      className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Reîmprospătează</span>
                    </button>
                  </div>
                </div>
                
                {/* Users Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Utilizator
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
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
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acțiuni
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                              Nu s-au găsit utilizatori care să corespundă criteriilor de căutare.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    {user.avatar_url ? (
                                      <img src={user.avatar_url} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                      <User className="h-5 w-5 text-gray-500" />
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.user_id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 flex items-center">
                                  <Mail className="h-4 w-4 mr-1 text-gray-400" />
                                  {user.email}
                                </div>
                                {user.phone && (
                                  <div className="text-sm text-gray-500 flex items-center mt-1">
                                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                                    {user.phone}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    user.seller_type === 'dealer' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {user.seller_type === 'dealer' ? 'Dealer' : 'Individual'}
                                  </span>
                                  
                                  {user.is_admin && (
                                    <span className="mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                      <Shield className="h-3 w-3 mr-1" />
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.suspended ? 'Suspendat' : 'Activ'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(user.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => navigate(`/profil/${user.user_id}`)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Vezi profilul"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                  
                                  {!user.is_admin && (
                                    <>
                                      <button
                                        onClick={() => handleToggleUserStatus(user.user_id, !user.suspended)}
                                        disabled={isProcessing[user.user_id]}
                                        className={`${
                                          user.suspended ? 'text-green-600 hover:text-green-900' : 'text-orange-600 hover:text-orange-900'
                                        } disabled:opacity-50`}
                                        title={user.suspended ? 'Activează utilizatorul' : 'Suspendă utilizatorul'}
                                      >
                                        {isProcessing[user.user_id] ? (
                                          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        ) : user.suspended ? (
                                          <CheckCircle className="h-5 w-5" />
                                        ) : (
                                          <Ban className="h-5 w-5" />
                                        )}
                                      </button>
                                      
                                      <button
                                        onClick={() => handleDeleteUser(user.user_id)}
                                        disabled={isProcessing[user.user_id] || user.is_admin}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                        title="Șterge utilizatorul"
                                      >
                                        {isProcessing[user.user_id] ? (
                                          <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          <Trash2 className="h-5 w-5" />
                                        )}
                                      </button>
                                    </>
                                  )}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;