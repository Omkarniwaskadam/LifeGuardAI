import React, { useState, useEffect } from 'react';
import { Shield, Phone, WifiOff, Download, Share, X, FileText, HeartPulse } from 'lucide-react';
import EmergencyCard from './components/EmergencyCard';
import LiveSession from './components/LiveSession';
import InfoModal from './components/InfoModal';
import ReportAnalyzerTab from './components/ReportAnalyzerTab';
import { EmergencyGuide } from './types';

const EMERGENCY_GUIDES: EmergencyGuide[] = [
  {
    id: 'cpr',
    title: 'CPR (Adult)',
    iconName: 'Heart',
    shortDesc: 'Cardiopulmonary Resuscitation for adults who are unresponsive and not breathing normally.',
    steps: [
      'Check the scene for safety.',
      'Check for responsiveness (tap and shout).',
      'Call 911 (or local emergency number).',
      'Check for breathing. If no breathing, start CPR.',
      'Place hands on center of chest. Push hard and fast (100-120 bpm).',
      'Push down at least 2 inches.',
      'Allow chest to recoil completely after each compression.',
      'Continue until help arrives or person breathes.'
    ]
  },
  {
    id: 'chest-pain',
    title: 'Chest Pain',
    iconName: 'Heart',
    shortDesc: 'Potential heart attack symptoms.',
    steps: [
      'Call 911 immediately.',
      'Have the person sit down and rest comfortably, keeping calm.',
      'Loosen any tight clothing.',
      'Ask if they take heart medication (like nitroglycerin) and help them take it if prescribed.',
      'If not allergic, give aspirin (chewable is best) if recommended by dispatch.',
      'Monitor breathing and be ready to perform CPR if they become unconscious.'
    ]
  },
  {
    id: 'bleeding',
    title: 'Severe Bleeding',
    iconName: 'Activity',
    shortDesc: 'Immediate actions to control severe bleeding.',
    steps: [
      'Call 911 immediately for severe bleeding.',
      'Apply direct pressure to the wound with a clean cloth or gauze.',
      'Keep pressure constant. Do not remove the cloth to look.',
      'Add more layers if blood soaks through.',
      'If on an arm or leg and bleeding doesn\'t stop, consider a tourniquet if trained.',
      'Keep the person warm and calm.'
    ]
  },
  {
    id: 'choking',
    title: 'Choking',
    iconName: 'Activity', 
    shortDesc: 'Heimlich maneuver for a conscious choking adult.',
    steps: [
      'Verify the person is choking (cannot speak, cough, or breathe).',
      'Stand behind the person.',
      'Wrap arms around their waist.',
      'Make a fist with one hand above the navel.',
      'Grab fist with other hand.',
      'Give quick, upward abdominal thrusts.',
      'Repeat until object is expelled.'
    ]
  },
  {
    id: 'head-injury',
    title: 'Head Injury',
    iconName: 'Brain',
    shortDesc: 'Concussion and trauma response.',
    steps: [
      'Encourage the person to rest and minimize movement.',
      'Apply ice to swollen areas (do not apply directly to skin).',
      'Check for confusion, vomiting, or loss of consciousness.',
      'If they lose consciousness or vomit, Call 911 immediately.',
      'Control any bleeding with gentle pressure.',
      'Do not leave them alone.'
    ]
  },
  {
    id: 'burns',
    title: 'Burns',
    iconName: 'Flame',
    shortDesc: 'First aid for minor to major burns.',
    steps: [
      'Stop the burning immediately.',
      'Cool the burn with cool (not cold) running water for 10-20 minutes.',
      'Do not use ice, butter, or ointments.',
      'Remove tight items/jewelry near the burn before swelling starts.',
      'Cover loosely with sterile, non-stick bandage.',
      'Call 911 for large burns, electrical burns, or chemical burns.'
    ]
  },
  {
    id: 'fracture',
    title: 'Fractures',
    iconName: 'Bone',
    shortDesc: 'Handling suspected broken bones.',
    steps: [
      'Stop any bleeding. Apply pressure with sterile bandage.',
      'Immobilize the injured area. Do not try to realign the bone.',
      'Apply ice packs to limit swelling (wrap ice in towel).',
      'Treat for shock (lay person down, head slightly lower than trunk).',
      'Seek professional medical help immediately.'
    ]
  },
  {
    id: 'panic',
    title: 'Panic Attack',
    iconName: 'Brain',
    shortDesc: 'Helping someone through a panic attack.',
    steps: [
      'Stay calm and speak in a reassuring voice.',
      'Encourage slow, deep breathing.',
      'Ask them to name 5 things they can see, 4 they can touch, etc.',
      'Stay with them until the attack passes.',
      'Do not dismiss their feelings.'
    ]
  }
];

type TabType = 'emergency' | 'analyzer';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('emergency');
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<EmergencyGuide | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Check if already in standalone mode
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isInStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'LifeGuard AI',
                text: 'Instant First Aid Support & Emergency Guides',
                url: window.location.href,
            });
        } catch (e) {
            console.log('Share cancelled');
        }
    } else {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        } catch (e) {
            console.error('Failed to copy', e);
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-28">
      
      {/* Header */}
      <header className="bg-white sticky top-0 z-30 border-b border-slate-100 shadow-sm safe-top">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-medic-red rounded-lg flex items-center justify-center text-white shadow-sm">
                    <Shield className="w-5 h-5 fill-current" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800">LifeGuard AI</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleShare}
                className="p-2 text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 rounded-full"
                aria-label="Share App"
              >
                  <Share className="w-4 h-4" />
              </button>
            </div>
        </div>
        {!isOnline && (
            <div className="bg-slate-800 text-white text-xs text-center py-1 font-semibold flex items-center justify-center gap-2">
                <WifiOff className="w-3 h-3" />
                Offline Mode Active. Live AI Unavailable.
            </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-8">
        
        {/* iOS Install Hint */}
        {isIOS && !isStandalone && (
            <div className="mb-6 bg-slate-100 p-4 rounded-xl border border-slate-200 text-sm text-slate-600 flex items-start gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Share className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                    <p className="font-semibold text-slate-800 mb-1">Install on iPhone/iPad</p>
                    <p>Tap the <strong className="text-blue-600">Share</strong> button below and select <strong className="text-slate-800">"Add to Home Screen"</strong> for offline access.</p>
                </div>
            </div>
        )}

        {activeTab === 'emergency' && (
          <>
            {/* Hero / Emergency Action */}
            <section className="mb-10 text-center">
                <div className="mb-6">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Emergency Assistance</h2>
                    <p className="text-slate-500">Instant AI guidance for critical situations.</p>
                </div>
                
                <button
                    onClick={() => isOnline ? setIsLiveSessionActive(true) : alert('Internet connection required for Live AI Support. Please use the Offline Guides below.')}
                    disabled={!isOnline}
                    className={`group relative w-full max-w-sm mx-auto aspect-square max-h-64 rounded-full flex flex-col items-center justify-center text-white transition-all ${
                        isOnline 
                        ? 'bg-gradient-to-br from-medic-red to-medic-dark shadow-2xl shadow-red-500/30 hover:scale-[1.02] active:scale-95 cursor-pointer' 
                        : 'bg-slate-300 shadow-none cursor-not-allowed opacity-80'
                    }`}
                >
                    {isOnline && <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-pulse-fast"></div>}
                    
                    {isOnline ? (
                        <>
                            <Phone className="w-16 h-16 mb-2 fill-current" />
                            <span className="text-2xl font-bold tracking-wide">CONNECT NOW</span>
                            <span className="text-sm text-red-100 mt-1 opacity-80">Video & Audio Support</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-16 h-16 mb-2 opacity-50" />
                            <span className="text-2xl font-bold tracking-wide text-slate-500">OFFLINE</span>
                            <span className="text-sm text-slate-500 mt-1">Check Connection</span>
                        </>
                    )}
                </button>
            </section>

            {/* Quick Guides Grid */}
            <section>
                <div className="flex justify-between items-end mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Quick Guides</h3>
                    <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider bg-slate-100 px-2 py-1 rounded">
                        {isOnline ? 'Available' : 'Offline Ready'}
                    </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {EMERGENCY_GUIDES.map(guide => (
                        <EmergencyCard 
                            key={guide.id}
                            title={guide.title}
                            iconName={guide.iconName}
                            onClick={() => setSelectedGuide(guide)}
                        />
                    ))}
                </div>
            </section>
          </>
        )}

        {activeTab === 'analyzer' && (
          <ReportAnalyzerTab />
        )}

      </main>

      {/* Footer */}
      {activeTab === 'emergency' && (
        <footer className="mt-16 text-center px-6 text-slate-400 text-sm pb-8">
          <p className="mb-2">LifeGuard AI is an assistive tool.</p>
          <p className="font-semibold text-slate-500">ALWAYS CALL 911 FOR EMERGENCIES.</p>
        </footer>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto flex">
          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'emergency' ? 'text-medic-red' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Shield className={`w-6 h-6 ${activeTab === 'emergency' ? 'fill-medic-red/20' : ''}`} />
            <span className="text-[10px] font-bold tracking-wide uppercase">Emergency</span>
          </button>
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`flex-1 py-4 flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'analyzer' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HeartPulse className={`w-6 h-6 ${activeTab === 'analyzer' ? 'fill-blue-600/20' : ''}`} />
            <span className="text-[10px] font-bold tracking-wide uppercase">Analyzer</span>
          </button>
        </div>
      </nav>

      {/* Install Banner */}
      {showInstallBanner && deferredPrompt && (
        <div className="fixed bottom-20 left-0 right-0 p-4 z-40 animate-slide-up">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between max-w-3xl mx-auto border border-white/10">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                        <Download className="w-6 h-6 text-medic-red" />
                    </div>
                    <div>
                        <p className="font-bold">Install LifeGuard AI</p>
                        <p className="text-xs text-slate-400">Available offline for emergencies.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowInstallBanner(false)}
                        className="p-2 text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleInstallClick}
                        className="bg-medic-red hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Modals */}
      {isLiveSessionActive && isOnline && (
          <LiveSession onEndSession={() => setIsLiveSessionActive(false)} />
      )}
      
      {selectedGuide && (
          <InfoModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} />
      )}

    </div>
  );
};

export default App;
