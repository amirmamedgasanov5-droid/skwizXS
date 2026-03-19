import React, { useState } from 'react';
import { auth, checkHandleAvailability, createUserDocument, uploadFile, mapAuthCodeToMessage, resetPassword } from '../services/firebase';
import { User as UserIcon, Upload, ChevronLeft, Lock, AtSign, X } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

interface AuthProps {
  onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Registration State
  const [step, setStep] = useState(1);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  // Role defaults to Student, UI selection removed
  const [role] = useState<'Student' | 'Sheikh Aspirant'>('Student');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset Password State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmailOrHandle, setResetEmailOrHandle] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  // Helpers
  const formatHandle = (val: string) => {
    const raw = val.replace(/\s/g, '').toLowerCase();
    return raw.startsWith('@') ? raw : `@${raw}`;
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const email = `${handle.replace('@', '')}@squwiz.com`;
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      
      let photoURL = null;
      if (avatar && userCredential.user) {
        photoURL = await uploadFile(avatar, `avatars/${userCredential.user.uid}`);
      }

      if (userCredential.user) {
        await createUserDocument(userCredential.user.uid, {
          handle,
          role,
          photoURL,
          isVerified: false,
          isAdmin: false,
        });
      }
      
      onLoginSuccess();
    } catch (err: any) {
      setError(mapAuthCodeToMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const email = `${handle.replace('@', '')}@squwiz.com`;
      await auth.signInWithEmailAndPassword(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(mapAuthCodeToMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const checkHandle = async () => {
    if (handle.length < 4) {
      setError('Minimum 3 characters.');
      return;
    }
    setLoading(true);
    const available = await checkHandleAvailability(handle);
    setLoading(false);
    if (available) {
      setStep(2);
      setError('');
    } else {
      setError('Handle is already taken.');
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmailOrHandle) return;
    setLoading(true);
    setResetMessage('');
    try {
        let email = resetEmailOrHandle.trim();
        if (!email.includes('@') || email.startsWith('@')) {
             email = `${email.replace('@', '')}@squwiz.com`;
        }
        
        await resetPassword(email);
        setResetMessage(`Reset link sent to ${email} (if account exists).`);
    } catch (e: any) {
        setResetMessage(`Error: ${e.message}`);
    } finally {
        setLoading(false);
    }
  };

  // Render Logic
  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm bg-white rounded-[32px] p-10 shadow-2xl shadow-black/5">
          <div className="flex justify-center mb-10">
            <Logo size={80} />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2 tracking-tight">Welcome to Skwiz</h1>
          <p className="text-sm text-gray-400 text-center mb-10 font-medium">Enter your handle and password</p>
          
          <div className="space-y-4">
            <input 
              className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-base font-medium focus:ring-2 focus:ring-black transition-all outline-none"
              placeholder="@handle" 
              value={handle} 
              onChange={(e) => setHandle(formatHandle(e.target.value))}
              autoCapitalize="none"
            />
            <div>
              <input 
                  type="password" 
                  className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-base font-medium focus:ring-2 focus:ring-black transition-all outline-none"
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
              />
              <div className="flex justify-end mt-3">
                  <button 
                      onClick={() => setShowResetModal(true)}
                      className="text-xs text-gray-400 hover:text-black font-bold transition-colors"
                  >
                      Forgot password?
                  </button>
              </div>
            </div>
            
            {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}

            <button 
              onClick={handleLogin} 
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            
            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold"><span className="bg-white px-4 text-gray-300">or</span></div>
            </div>

            <button 
              onClick={() => setMode('register')} 
              className="w-full py-4 bg-gray-100 text-black rounded-2xl font-bold text-base hover:bg-gray-200 transition-all active:scale-95"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Reset Password Modal */}
        {showResetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowResetModal(false)} />
                <div className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-black tracking-tight">Reset Password</h2>
                        <button onClick={() => setShowResetModal(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><X size={18}/></button>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-6 font-medium">
                        Enter your handle or email. We'll send you a reset link.
                    </p>

                    <div className="space-y-4">
                        <input 
                            className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-base font-medium focus:ring-2 focus:ring-black transition-all outline-none"
                            placeholder="@handle or email" 
                            value={resetEmailOrHandle}
                            onChange={e => setResetEmailOrHandle(e.target.value)}
                        />
                        {resetMessage && (
                            <p className={`text-xs text-center font-bold ${resetMessage.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
                                {resetMessage}
                            </p>
                        )}
                        <button 
                          onClick={handleResetPassword} 
                          disabled={loading || !resetEmailOrHandle}
                          className="w-full py-4 bg-black text-white rounded-2xl font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
                        >
                          {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // Registration Multi-Step
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-[32px] p-10 shadow-2xl shadow-black/5">
        <div className="mb-10">
          <button 
            onClick={() => {
               if (step > 1) setStep(step - 1);
               else setMode('login');
            }}
            className="p-2 -ml-2 rounded-full hover:bg-gray-50 inline-block mb-6 text-black transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-black tracking-tight">Step {step}/3</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">
            {step === 1 && "Choose your handle."}
            {step === 2 && "Secure your account."}
            {step === 3 && "Complete your profile."}
          </p>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <AtSign className="absolute top-1/2 left-6 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl text-base font-medium focus:ring-2 focus:ring-black transition-all outline-none"
                  placeholder="handle"
                  value={handle}
                  onChange={(e) => setHandle(formatHandle(e.target.value))}
                  autoCapitalize="none"
                />
              </div>
              {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
              <button 
                onClick={checkHandle} 
                disabled={loading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? "Checking..." : "Check Availability"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
               <div className="relative">
                <Lock className="absolute top-1/2 left-6 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl text-base font-medium focus:ring-2 focus:ring-black transition-all outline-none"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
              <button 
                onClick={() => password.length >= 6 ? setStep(3) : setError('Minimum 6 characters')}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
              >
                Next Step
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="relative w-28 h-28 mx-auto mb-6 bg-gray-50 rounded-[40px] overflow-hidden flex items-center justify-center border border-gray-100 group">
                {avatar ? (
                  <img src={URL.createObjectURL(avatar)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={40} className="text-gray-300" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                  <Upload size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && setAvatar(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-400 mb-8 font-bold">Tap to upload profile photo</p>

              {error && <p className="text-red-500 text-xs text-center mb-6 font-bold">{error}</p>}
              
              <button 
                onClick={handleRegister} 
                disabled={loading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? "Creating..." : "Complete Registration"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
