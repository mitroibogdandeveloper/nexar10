import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listings, checkConnection, Listing } from '../lib/supabase'
import ConnectionDiagnostics from '../components/ConnectionDiagnostics'

const HomePage: React.FC = () => {
  const [allListings, setAllListings] = useState<Listing[]>([])
  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })

  // Categorii disponibile
  const categories = [
    'autoturisme',
    'motociclete',
    'camioane',
    'autobuze',
    'remorci',
    'utilaje',
    'piese-auto',
    'accesorii'
  ]

  // Funcție pentru încărcarea anunțurilor cu gestionarea erorilor îmbunătățită
  const loadListings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Starting to load listings...')
      
      // Verificăm mai întâi conexiunea
      const connectionCheck = await checkConnection()
      setConnectionStatus(connectionCheck)
      
      if (!connectionCheck.success) {
        console.error('❌ Connection check failed:', connectionCheck.error)
        setError(`Conexiune eșuată: ${connectionCheck.error}`)
        setShowDiagnostics(true)
        return
      }
      
      console.log('✅ Connection check passed, fetching listings...')
      
      // Încărcăm anunțurile
      const { data, error: listingsError } = await listings.getAll()
      
      if (listingsError) {
        console.error('❌ Error loading listings:', listingsError)
        setError(`Eroare la încărcarea anunțurilor: ${listingsError.message || 'Eroare necunoscută'}`)
        setShowDiagnostics(true)
        return
      }
      
      if (data) {
        console.log(`✅ Successfully loaded ${data.length} listings`)
        setAllListings(data)
        setFilteredListings(data)
        setError(null)
      } else {
        console.log('⚠️ No listings data received')
        setAllListings([])
        setFilteredListings([])
      }
      
    } catch (err: any) {
      console.error('💥 Error in loadListings:', err)
      setError(`Eroare neașteptată: ${err.message || 'Eroare de rețea'}`)
      setShowDiagnostics(true)
    } finally {
      setLoading(false)
    }
  }

  // Încărcăm anunțurile la montarea componentei
  useEffect(() => {
    loadListings()
  }, [])

  // Funcție pentru filtrarea anunțurilor
  const filterListings = () => {
    let filtered = [...allListings]

    // Filtrare după termenul de căutare
    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrare după categorie
    if (selectedCategory) {
      filtered = filtered.filter(listing =>
        listing.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Filtrare după locație
    if (selectedLocation) {
      filtered = filtered.filter(listing =>
        listing.location.toLowerCase().includes(selectedLocation.toLowerCase())
      )
    }

    // Filtrare după preț
    if (priceRange.min) {
      filtered = filtered.filter(listing => listing.price >= parseInt(priceRange.min))
    }
    if (priceRange.max) {
      filtered = filtered.filter(listing => listing.price <= parseInt(priceRange.max))
    }

    setFilteredListings(filtered)
  }

  // Aplicăm filtrele când se schimbă criteriile
  useEffect(() => {
    filterListings()
  }, [searchTerm, selectedCategory, selectedLocation, priceRange, allListings])

  // Funcție pentru formatarea prețului
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  // Funcție pentru retry
  const handleRetry = () => {
    setShowDiagnostics(false)
    loadListings()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Se încarcă anunțurile...</p>
        </div>
      </div>
    )
  }

  if (error && showDiagnostics) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Problemă de conexiune detectată
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                🔄 Încearcă din nou
              </button>
              <button
                onClick={() => setShowDiagnostics(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                ❌ Ascunde diagnosticele
              </button>
            </div>
          </div>

          <ConnectionDiagnostics />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Găsește vehiculul perfect
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Cea mai mare platformă de anunțuri auto din România
            </p>
            
            {/* Bara de căutare principală */}
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Caută vehicule..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  />
                </div>
                
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Toate categoriile</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <input
                    type="text"
                    placeholder="Locația"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Preț min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  />
                  <input
                    type="number"
                    placeholder="Preț max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistici rapide */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {allListings.length.toLocaleString()}
              </div>
              <div className="text-gray-600">Anunțuri active</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {categories.length}
              </div>
              <div className="text-gray-600">Categorii disponibile</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {filteredListings.length.toLocaleString()}
              </div>
              <div className="text-gray-600">Rezultate găsite</div>
            </div>
          </div>
        </div>
      </div>

      {/* Anunțuri */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nu am găsit anunțuri
            </h3>
            <p className="text-gray-600 mb-6">
              Încearcă să modifici criteriile de căutare sau să ștergi filtrele.
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('')
                setSelectedLocation('')
                setPriceRange({ min: '', max: '' })
              }}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Șterge toate filtrele
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Anunțuri recente ({filteredListings.length})
              </h2>
              <Link
                to="/listings"
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Vezi toate →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.slice(0, 12).map((listing) => (
                <Link
                  key={listing.id}
                  to={`/listing/${listing.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="aspect-w-16 aspect-h-12">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-4xl">🚗</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {listing.title}
                    </h3>
                    
                    <div className="text-2xl font-bold text-red-600 mb-2">
                      {formatPrice(listing.price)}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <span className="w-4 h-4 mr-2">📅</span>
                        {listing.year}
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 mr-2">🛣️</span>
                        {listing.mileage?.toLocaleString()} km
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 mr-2">📍</span>
                        {listing.location}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {listing.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {listing.seller_type === 'dealer' ? '🏢 Dealer' : '👤 Particular'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredListings.length > 12 && (
              <div className="text-center mt-12">
                <Link
                  to="/listings"
                  className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Vezi toate anunțurile ({filteredListings.length})
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-red-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Vrei să vinzi vehiculul tău?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Publică un anunț gratuit și ajunge la mii de cumpărători potențiali
          </p>
          <Link
            to="/create-listing"
            className="bg-white text-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors inline-block"
          >
            Publică anunț gratuit
          </Link>
        </div>
      </div>

      {/* Status de conexiune (pentru debugging) */}
      {connectionStatus && !connectionStatus.success && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center">
            <span className="text-sm">⚠️ Problemă de conexiune</span>
            <button
              onClick={() => setShowDiagnostics(true)}
              className="ml-2 text-xs underline"
            >
              Diagnosticare
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage