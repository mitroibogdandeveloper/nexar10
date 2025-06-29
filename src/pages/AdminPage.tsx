import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Package, User, Shield, 
  Check, X, Edit, Trash2, Eye, AlertTriangle, 
  RefreshCw, Building, UserX, UserCheck, Search,
  CheckCircle, XCircle
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
  const [isProcessing, setIsProcessing] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verifică dacă utilizatorul este admin
      const isAdminUser = await admin.isAdmin();
      setIsAdmin(isAdminUser);
      
      if (!isAdminUser) {
        setError('Nu ai permisiunea de a accesa această pagină. Doar administratorii pot vedea panoul de administrare.');
        setIsLoading(false);
        return;
      }
      
      // Încarcă datele în funcție de tab-ul activ
      if (activeTab === 'listings') {
        await loadListings();
      } else if (activeTab === 'users') {
        await loadUsers();
      }
      
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError('A apărut o eroare la verificarea statusului de administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadListings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Folosim getAllForAdmin pentru a obține TOATE anunțurile, inclusiv cele în așteptare
      const { data, error } = await admin.getAllListings();
      
      if (error) {
        console.error('Error loading listings:', error);
        setError('Nu s-au putut încărca anunțurile.');
        return;
      }
      
      console.log('Loaded listings:', data?.length || 0, data);
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
        setError('Nu s-au putut încărca utilizatorii.');
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

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    setSearchQuery('');
    
    if (tab === 'listings' && listings.length === 0) {
      await loadListings();
    } else if (tab === 'users' && users.length === 0) {
      await loadUsers();
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
      
      // Actualizează lista de anunțuri
      setListings(prev => 
        prev.map(listing => 
          listing.id === listingId ? { ...listing, status } : listing
        )
      );
      
      alert(`Statusul anunțului a fost actualizat la "${status}".`);
      
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
      
      // Elimină anunțul din listă
      setListings(prev => prev.filter(listing => listing.id !== listingId));
      
      alert('Anunțul a fost șters cu succes!');
      
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
        alert(`Eroare la ${suspended ? 'suspendarea' : 'activarea'} utilizatorului: ${error.message}`);
        return;
      }
      
      // Actualizează lista de utilizatori
      setUsers(prev => 
        prev.map(user => 
          user.user_id === userId ? { ...user, suspended } : user
        )
      );
      
      alert(`Utilizatorul a fost ${suspended ? 'suspendat' : 'activat'} cu succes!`);
      
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert(`A apărut o eroare la ${suspended ? 'suspendarea' : 'activarea'} utilizatorului.`);
    } finally {
      setIsProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('ATENȚIE: Această acțiune va șterge utilizatorul și TOATE anunțurile asociate din baza de date. Contul de autentificare va rămâne activ din motive de securitate. Ești sigur că vrei să continui?')) return;
    
    try {
      setIsProcessing(prev => ({ ...prev, [userId]: true }));
      
      // 1. Obținem profilul utilizatorului
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError);
        alert('Eroare la găsirea profilului utilizatorului');
        setIsProcessing(prev => ({ ...prev, [userId]: false }));
        return;
      }
      
      // 2. Ștergem toate anunțurile utilizatorului
      const { error: listingsError } = await supabase
        .from('listings')
        .delete()
        .eq('seller_id', profile.id);
      
      if (listingsError) {
        console.error('Error deleting user listings:', listingsError);
        alert('Eroare la ștergerea anunțurilor utilizatorului');
        setIsProcessing(prev => ({ ...prev, [userId]: false }));
        return;
      }
      
      // 3. Ștergem profilul utilizatorului
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (deleteProfileError) {
        console.error('Error deleting user profile:', deleteProfileError);
        alert('Eroare la ștergerea profilului utilizatorului');
        setIsProcessing(prev => ({ ...prev, [userId]: false }));
        return;
      }
      
      // Eliminăm utilizatorul din listă
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      
      // Reîncarcă și anunțurile pentru a reflecta ștergerea
      await loadListings();
      
      alert('Utilizatorul și toate anunțurile asociate au fost șterse cu succes din baza de date!');
      
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('A apărut o eroare la ștergerea utilizatorului.');
    } finally {
      setIsProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleViewListing = (listingId: string) => {
    window.open(`/anunt/${listingId}`, '_blank');
  };

  const handleEditListing = (listingId: string) => {
    navigate(`/editeaza-anunt/${listingId}`);
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profil/${userId}`);
  };

  // Filtrare anunțuri
  const filteredListings = listings.filter(listing => {
    // Filtrare după text
    const matchesSearch = !searchQuery || 
      listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.model?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtrare după status
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filtrare utilizatori
  const filteredUsers = users.filter(user => {
    return !searchQuery || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Loading state
  if (isLoading && !listings.length && !users.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 border-4 border-nexar-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă datele...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acces Restricționat
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
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
          <div className="p-6 bg-gray-900 text-white">
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
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Caută ${activeTab === 'listings' ? 'anunțuri' : 'utilizatori'}...`}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
              
              {activeTab === 'listings' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-nexar-accent focus:border-transparent"
                >
                  <option value="all">Toate statusurile</option>
                  <option value="active">Active</option>
                  <option value="pending">În așteptare</option>
                  <option value="rejected">Respinse</option>
                  <option value="sold">Vândute</option>
                </select>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-6 bg-red-50 border-b border-red-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <div>
                  <h3 className="font-semibold text-red-800">Eroare</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={checkAdminAndLoadData}
                  className="flex items-center space-x-2 bg-nexar-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-nexar-gold transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reîncearcă</span>
                </button>
              </div>
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="overflow-x-auto">
              {isLoading && listings.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-nexar-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Se încarcă anunțurile...</p>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchQuery ? 'Nu am găsit anunțuri care să corespundă căutării' : 'Nu există anunțuri'}
                  </h3>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-nexar-accent hover:text-nexar-gold transition-colors"
                    >
                      Șterge filtrele
                    </button>
                  )}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acțiuni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredListings.map((listing) => (
                      <tr key={listing.id} className={`hover:bg-gray-50 ${listing.status === 'pending' ? 'bg-yellow-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-md object-cover"
                                src={listing.images && listing.images[0] ? listing.images[0] : "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg"}
                                alt={listing.title}
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
                              <div className="text-sm text-gray-500">
                                {listing.brand} {listing.model}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {listing.seller_name}
                            </div>
                            <div className="ml-2">
                              {listing.profiles?.seller_type === 'dealer' ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Dealer
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Privat
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {listing.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            listing.status === 'active' ? 'bg-green-100 text-green-800' :
                            listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                            listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {listing.status === 'active' ? 'Activ' :
                             listing.status === 'sold' ? 'Vândut' :
                             listing.status === 'pending' ? 'În așteptare' :
                             'Respins'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{listing.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(listing.created_at).toLocaleDateString('ro-RO')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewListing(listing.id)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Vezi anunțul"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEditListing(listing.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editează anunțul"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              disabled={isProcessing[listing.id]}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Șterge anunțul"
                            >
                              {isProcessing[listing.id] ? (
                                <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </button>
                            <div className="border-l border-gray-300 h-5 mx-2"></div>
                            <div className="flex space-x-1">
                              {/* Buton pentru aprobarea anunțurilor în așteptare */}
                              {listing.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateListingStatus(listing.id, 'active')}
                                  disabled={isProcessing[listing.id]}
                                  className="bg-green-100 text-green-800 p-1.5 rounded-lg hover:bg-green-200 transition-colors"
                                  title="Aprobă anunțul"
                                >
                                  {isProcessing[listing.id] ? (
                                    <div className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <CheckCircle className="h-5 w-5" />
                                  )}
                                </button>
                              )}
                              
                              {/* Buton pentru respingerea anunțurilor în așteptare */}
                              {listing.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateListingStatus(listing.id, 'rejected')}
                                  disabled={isProcessing[listing.id]}
                                  className="bg-red-100 text-red-800 p-1.5 rounded-lg hover:bg-red-200 transition-colors"
                                  title="Respinge anunțul"
                                >
                                  {isProcessing[listing.id] ? (
                                    <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <XCircle className="h-5 w-5" />
                                  )}
                                </button>
                              )}
                              
                              {/* Buton pentru activarea anunțurilor respinse */}
                              {listing.status === 'rejected' && (
                                <button
                                  onClick={() => handleUpdateListingStatus(listing.id, 'active')}
                                  disabled={isProcessing[listing.id]}
                                  className="bg-green-100 text-green-800 p-1.5 rounded-lg hover:bg-green-200 transition-colors"
                                  title="Activează anunțul"
                                >
                                  {isProcessing[listing.id] ? (
                                    <div className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <CheckCircle className="h-5 w-5" />
                                  )}
                                </button>
                              )}
                              
                              {/* Buton pentru dezactivarea anunțurilor active */}
                              {listing.status === 'active' && (
                                <button
                                  onClick={() => handleUpdateListingStatus(listing.id, 'rejected')}
                                  disabled={isProcessing[listing.id]}
                                  className="bg-red-100 text-red-800 p-1.5 rounded-lg hover:bg-red-200 transition-colors"
                                  title="Dezactivează anunțul"
                                >
                                  {isProcessing[listing.id] ? (
                                    <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <XCircle className="h-5 w-5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              {isLoading && users.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-nexar-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Se încarcă utilizatorii...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchQuery ? 'Nu am găsit utilizatori care să corespundă căutării' : 'Nu există utilizatori'}
                  </h3>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-nexar-accent hover:text-nexar-gold transition-colors"
                    >
                      Șterge filtrele
                    </button>
                  )}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilizator
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tip
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data înregistrării
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acțiuni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {user.avatar_url ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.avatar_url}
                                  alt={user.name}
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-nexar-accent flex items-center justify-center text-white font-semibold text-xs">
                                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.location || 'Locație nespecificată'}
                              </div>
                            </div>
                            {user.is_admin && (
                              <div className="ml-2">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                  Admin
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.seller_type === 'dealer' ? (
                            <div className="flex items-center">
                              <Building className="h-4 w-4 text-green-600 mr-1" />
                              <span className="text-sm text-green-800 font-medium">Dealer</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-600 mr-1" />
                              <span className="text-sm text-gray-800">Individual</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.suspended ? 'Suspendat' : 'Activ'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('ro-RO')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewProfile(user.id)}
                              className="text-gray-600 hover:text-gray-900"
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
                                    user.suspended ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
                                  } disabled:opacity-50`}
                                  title={user.suspended ? 'Activează utilizatorul' : 'Suspendă utilizatorul'}
                                >
                                  {isProcessing[user.user_id] ? (
                                    <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                  ) : user.suspended ? (
                                    <UserCheck className="h-5 w-5" />
                                  ) : (
                                    <UserX className="h-5 w-5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.user_id)}
                                  disabled={isProcessing[user.user_id] || user.is_admin}
                                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                  title={user.is_admin ? 'Nu poți șterge un administrator' : 'Șterge utilizatorul'}
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
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {activeTab === 'listings' ? (
                  `${filteredListings.length} anunțuri`
                ) : (
                  `${filteredUsers.length} utilizatori`
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (activeTab === 'listings') {
                      loadListings();
                    } else {
                      loadUsers();
                    }
                  }}
                  className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reîmprospătează</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;