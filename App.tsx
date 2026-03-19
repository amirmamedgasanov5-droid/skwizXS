import React, { useEffect, useState } from 'react';
import { auth, getUserProfile, subscribeToTotalUnreadMessages, subscribeToSystemStatus, subscribeToUnreadNotificationsCount } from './services/firebase';
import firebase from 'firebase/compat/app';
import { UserProfile } from './types';
import { Auth } from './pages/Auth';
import { Feed } from './pages/Feed';
import { Create } from './pages/Create';
import { Profile } from './pages/Profile';
import { Search } from './pages/Search';
import { Groups } from './pages/Groups';
import { Direct } from './pages/Direct';
import { Notifications } from './pages/Notifications';
import { Premium } from './pages/Premium';
import { Rules } from './pages/Rules';
import { Wallet } from './pages/Wallet';
import { Navbar } from './components/Navbar';
import { Header } from './components/Header';
import { Logo } from './components/ui/Logo';
import { AdminConsole } from './pages/AdminConsole';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import SideMenu from './components/SideMenu';
import { Plus, X, Hammer, RefreshCw, Menu } from 'lucide-react';
import { useAppContext } from './contexts/AppContext';

// --- Maintenance Screen ---
const MaintenanceScreen = () => (
  <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
     <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-8 border border-gray-100">
        <Hammer size={40} className="text-black animate-pulse" />
     </div>
     <h1 className="text-3xl font-bold mb-4 tracking-tight">Технические работы</h1>
     <p className="text-gray-500 max-w-xs leading-relaxed mb-8">
        Skwiz обновляет матрицу для улучшения стабильности. Пожалуйста, вернитесь немного позже.
     </p>
     <button 
        onClick={() => window.location.reload()} 
        className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-900 transition-colors"
     >
        <RefreshCw size={14} /> Проверить статус
     </button>
  </div>
);

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState('feed');
  const [openedChatId, setOpenedChatId] = useState<string | null>(null);
  const [viewedProfileUid, setViewedProfileUid] = useState<string | null>(null);
  const [viewedPostId, setViewedPostId] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  
  // PWA Install Prompt State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  // Global Context
  const { theme } = useAppContext();

  // Subscribe to System Maintenance Status
  useEffect(() => {
    const unsub = subscribeToSystemStatus((status) => {
      setMaintenanceMode(status.maintenanceMode);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          let profile = await getUserProfile(user.uid);
          
          // Check for special admins (@amir, @skwiz)
          const adminEmails = ['amir@squwiz.com', 'skwiz@squwiz.com', 'amirmamedgasanov5@gmail.com'];
          const isAdminUser = user.email && (adminEmails.includes(user.email) || user.email.startsWith('@amir') || user.email.startsWith('@skwiz'));

          if (isAdminUser) {
            if (profile) {
              profile.isAdmin = true;
              profile.isVerified = true;
            }
          }
          setUserProfile(profile);
        } catch (e) {
          console.error("Profile load failed", e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to unread messages when user is logged in
  useEffect(() => {
     if (!userProfile) return;
     const unsubMessages = subscribeToTotalUnreadMessages(userProfile.uid, (count) => {
        setUnreadMessageCount(count);
     });
     const unsubNotifs = subscribeToUnreadNotificationsCount(userProfile.uid, (count) => {
        setUnreadNotificationCount(count);
     });
     return () => {
       unsubMessages();
       unsubNotifs();
     };
  }, [userProfile]);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault(); 
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleOpenChat = (chatId: string) => {
    setOpenedChatId(chatId);
    setCurrentPage('direct');
  };

  const handleViewProfile = (uid: string) => {
    setViewedProfileUid(uid);
    setCurrentPage('profile');
  };

  const handleViewPost = (postId: string) => {
    setViewedPostId(postId);
    setCurrentPage('feed');
    // We might need to tell Feed to scroll to or highlight this post
  };

  const handleNav = (page: string) => {
    if (page === 'profile') {
      setViewedProfileUid(userProfile?.uid || null);
    }
    setCurrentPage(page);
    setIsNavbarVisible(true);
  };

  const renderPage = () => {
    if (!userProfile) return null;
    switch (currentPage) {
      case 'feed': 
        return <Feed 
                  currentUserUid={userProfile.uid} 
                  onNavigate={handleNav} 
                  onViewProfile={handleViewProfile}
                  onToggleNavbar={setIsNavbarVisible}
               />;
      case 'create': 
        return <Create user={userProfile} onPostCreated={() => setCurrentPage('feed')} />;
      case 'groups': 
        return <Groups user={userProfile} />;
      case 'direct': 
        return <Direct openedChatId={openedChatId} onCloseChat={() => setOpenedChatId(null)} onNavigate={handleNav} />;
      case 'profile': 
        return <Profile 
                  currentUser={userProfile} 
                  viewedUid={viewedProfileUid || userProfile.uid} 
                  onBack={viewedProfileUid && viewedProfileUid !== userProfile.uid ? () => setCurrentPage('feed') : undefined}
                  onOpenChat={handleOpenChat}
                  onNavigate={handleNav}
                  onToggleNavbar={setIsNavbarVisible}
               />;
      case 'search': 
        return <Search onOpenChat={handleOpenChat} onViewProfile={handleViewProfile} />;
      case 'notifications':
        return <Notifications 
                  uid={userProfile.uid} 
                  onViewProfile={handleViewProfile} 
                  onViewPost={handleViewPost}
               />;
      case 'premium':
        return <Premium user={userProfile} onBack={() => setCurrentPage('profile')} />;
      case 'wallet':
        return <Wallet user={userProfile} onBack={() => setCurrentPage('profile')} />;
      case 'rules':
        return <Rules onBack={() => setCurrentPage('feed')} />;
      case 'admin': 
        return userProfile.isAdmin ? <AdminConsole /> : <Feed currentUserUid={userProfile.uid} onNavigate={handleNav} onViewProfile={handleViewProfile}/>;
      default: 
        return <Feed currentUserUid={userProfile.uid} onNavigate={handleNav} onViewProfile={handleViewProfile}/>;
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // --- Maintenance Check ---
  // If maintenance is ON and user is NOT an admin, block access.
  if (maintenanceMode) {
    // If not logged in, or logged in but not admin -> Show Maintenance
    if (!userProfile || !userProfile.isAdmin) {
       return <MaintenanceScreen />;
    }
    // If Admin -> allow pass through (fall to next check)
  }

  if (!firebaseUser || !userProfile) {
    return <Auth onLoginSuccess={() => {/* State updates via listener */}} />;
  }

  const showCreateButton = false; // Moved to header as per design

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white text-black font-sans pb-20 relative transition-colors duration-300">
        {/* Admin Maintenance Banner */}
        {maintenanceMode && userProfile.isAdmin && (
           <div className="fixed bottom-20 left-0 right-0 bg-black text-white text-[10px] font-bold text-center py-1 z-[60] uppercase tracking-widest">
              Maintenance Mode On
           </div>
        )}

        {/* Header */}
        {currentPage !== 'direct' && currentPage !== 'create' && currentPage !== 'premium' && (
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between max-w-screen-md mx-auto w-full border-b border-gray-100">
            <button 
              onClick={() => setIsSideMenuOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex-1 flex justify-center">
              <Logo size={40} className="grayscale brightness-0" />
            </div>
            
            <button 
              onClick={() => handleNav('create')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Plus size={24} />
            </button>
          </header>
        )}

        {isSideMenuOpen && (
          <SideMenu 
            user={userProfile} 
            onClose={() => setIsSideMenuOpen(false)} 
            onNavigate={(page) => {
              handleNav(page);
              setIsSideMenuOpen(false);
            }} 
          />
        )}

        {/* PWA Stylish Header / Install Block */}
        {installPrompt && (
          <div className="fixed top-0 left-0 right-0 z-[100] p-3 bg-white border-b border-gray-100 animate-in slide-in-from-top duration-500 shadow-sm">
              <div className="max-w-screen-md mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/20 overflow-hidden">
                          <Logo size={32} />
                      </div>
                      <div>
                          <h3 className="font-bold text-sm leading-tight tracking-tight">Skwiz</h3>
                          <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">The Pulse of Truth</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <button 
                          onClick={() => setInstallPrompt(null)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                          <X size={16} className="text-gray-500"/>
                      </button>
                      <button 
                          onClick={async () => {
                              if(!installPrompt) return;
                              installPrompt.prompt();
                              const { outcome } = await installPrompt.userChoice;
                              if(outcome === 'accepted') setInstallPrompt(null);
                          }}
                          className="px-4 py-2 bg-black text-white rounded-full text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                      >
                          Установить
                      </button>
                  </div>
              </div>
          </div>
        )}

        <div className="max-w-screen-md mx-auto">
           {renderPage()}
        </div>
        
        {/* Floating Create Button */}
        {showCreateButton && (
          <button
            onClick={() => setCurrentPage('create')}
            className="fixed bottom-24 right-6 w-14 h-14 bg-black text-white rounded-full shadow-xl flex items-center justify-center z-50 hover:scale-105 transition-transform"
          >
            <Plus size={32} />
          </button>
        )}

        {isNavbarVisible && (
          <Navbar 
            currentPage={currentPage} 
            onNavigate={handleNav} 
            isAdmin={userProfile.isAdmin}
            unreadCount={unreadMessageCount}
            unreadNotificationsCount={unreadNotificationCount}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}