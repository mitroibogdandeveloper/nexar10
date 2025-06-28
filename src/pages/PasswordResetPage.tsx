import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Home, LogIn } from 'lucide-react';
import { supabase, auth } from '../lib/supabase';

const PasswordResetPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const checkResetToken = async () => {
      try {
        setIsLoading(true);
        
        // Verificăm dacă avem un token valid în URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          setError('Link-ul de resetare a parolei este invalid sau a expirat.');
          return;
        }
        
        if (data?.session) {
          console.log('Valid reset token found');
          setIsValid(true);
        } else {
          console.error('No session found for password reset');
          setError('Link-ul de resetare a parolei este invalid sau a expirat.');
        }
      } catch (err) {
        console.error('Error during token validation:', err);
        setError('A apărut o eroare la validarea link-ului de resetare.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkResetToken();
  }, []);

  const validatePassword = (password: string): string => {
    if (!password) return 'Parola este obligatorie';
    if (password.length < 8) return 'Parola trebuie să aibă cel puțin 8 caractere';
    if (!/(?=.*[a-z])/.test(password)) return 'Parola trebuie să conțină cel puțin o literă mică';
    if (!/(?=.*[A-Z])/.test(password)) return 'Parola trebuie să conțină cel puțin o literă mare';
    if (!/(?=.*\d)/.test(password)) return 'Parola trebuie să conțină cel puțin o cifră';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validare
    const errors: Record<string, string> = {};
    
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Parolele nu coincid';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const { error } = await auth.updatePassword(password);
      
      if (error) {
        console.error('Error updating password:', error);
        setError(`Eroare la actualizarea parolei: ${error.message}`);
      } else {
        setIsSuccess(true);
        
        // Redirecționăm către pagina de login după 3 secunde
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    } catch (err) {
      console.error('Error updating password:', err);
      setError('A apărut o eroare la actualizarea parolei. Te rugăm să încerci din nou.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 border-4 border-nexar-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Se verifică link-ul de resetare...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Parolă actualizată cu succes!
            </h2>
            <p className="text-gray-600 mb-8">
              Parola ta a fost schimbată. Acum te poți conecta cu noile credențiale.
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
          </div>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Link invalid
            </h2>
            <p className="text-gray-600 mb-8">
              {error || 'Link-ul de resetare a parolei este invalid sau a expirat. Te rugăm să soliciți un nou link de resetare.'}
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/auth"
                className="flex-1 bg-nexar-accent text-white py-3 rounded-lg font-semibold hover:bg-nexar-gold transition-colors flex items-center justify-center space-x-2"
              >
                <LogIn className="h-5 w-5" />
                <span>Înapoi la Conectare</span>
              </Link>
              <Link
                to="/"
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="h-5 w-5" />
                <span>Pagina Principală</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <img 
                src="/Nexar - logo_black & red.png" 
                alt="Nexar Logo" 
                className="h-20 w-auto"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src.includes('Nexar - logo_black & red.png')) {
                    target.src = '/nexar-logo.png';
                  } else if (target.src.includes('nexar-logo.png')) {
                    target.src = '/image.png';
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Resetează Parola
            </h2>
            <p className="text-gray-600">
              Introdu noua parolă pentru contul tău
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parolă Nouă *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-nexar-accent focus:border-transparent ${
                    validationErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Minim 8 caractere"
                  required
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmă Parola *
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (validationErrors.confirmPassword) {
                      setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  className={`w-full pl-10 py-3 border rounded-xl focus:ring-2 focus:ring-nexar-accent focus:border-transparent ${
                    validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Repetă parola nouă"
                  required
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-nexar-accent text-white py-3 rounded-xl font-semibold hover:bg-nexar-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Se procesează...</span>
                </div>
              ) : (
                'Resetează Parola'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/auth"
              className="text-nexar-accent hover:text-nexar-gold transition-colors"
            >
              Înapoi la conectare
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;