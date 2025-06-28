import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Home, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AuthConfirmPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        setIsLoading(true);
        
        // Verificăm dacă avem o sesiune validă după confirmarea email-ului
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          setError('A apărut o eroare la confirmarea contului. Te rugăm să încerci din nou.');
          return;
        }
        
        if (data?.session) {
          console.log('Email confirmed successfully, session found:', data.session);
          setIsConfirmed(true);
          
          // Actualizăm starea utilizatorului în localStorage
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Obținem profilul utilizatorului
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();
            
            if (profile) {
              const userData = {
                id: user.id,
                name: profile.name,
                email: profile.email,
                sellerType: profile.seller_type,
                isAdmin: profile.is_admin || user.email === 'admin@nexar.ro',
                isLoggedIn: true
              };
              
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }
        } else {
          console.error('No session found after email confirmation');
          setError('Linkul de confirmare a expirat sau este invalid. Te rugăm să încerci din nou.');
        }
      } catch (err) {
        console.error('Error during email confirmation:', err);
        setError('A apărut o eroare neașteptată. Te rugăm să încerci din nou.');
      } finally {
        setIsLoading(false);
      }
    };
    
    handleEmailConfirmation();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 border-4 border-nexar-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Se procesează confirmarea contului...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {isConfirmed ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Cont confirmat cu succes!
              </h2>
              <p className="text-gray-600 mb-8">
                Bine ai venit! Contul tău Nexar a fost confirmat cu succes. Te poți bucura acum de toate funcționalitățile platformei. Dacă ai nevoie de asistență sau ai întrebări, echipa noastră de suport îți stă la dispoziție.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/"
                  className="flex-1 bg-nexar-accent text-white py-3 rounded-lg font-semibold hover:bg-nexar-gold transition-colors flex items-center justify-center space-x-2"
                >
                  <Home className="h-5 w-5" />
                  <span>Pagina Principală</span>
                </Link>
                <Link
                  to="/adauga-anunt"
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Adaugă Anunț</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Confirmare eșuată
              </h2>
              <p className="text-gray-600 mb-8">
                {error || 'A apărut o eroare la confirmarea contului. Te rugăm să încerci din nou sau să contactezi suportul.'}
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/auth"
                  className="flex-1 bg-nexar-accent text-white py-3 rounded-lg font-semibold hover:bg-nexar-gold transition-colors flex items-center justify-center space-x-2"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Conectează-te</span>
                </Link>
                <Link
                  to="/"
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
                >
                  <Home className="h-5 w-5" />
                  <span>Pagina Principală</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Adăugăm componenta Plus pentru butonul "Adaugă Anunț"
const Plus = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default AuthConfirmPage;