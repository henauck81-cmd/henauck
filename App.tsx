import React, { useState, useEffect, useRef } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine 
} from 'recharts';
import { 
  Plus, 
  LayoutDashboard, 
  PieChart as ChartIcon, 
  Settings, 
  Mic, 
  Send,
  X,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  AlertCircle,
  Pencil,
  Camera,
  Check,
  Image as ImageIcon,
  Fingerprint,
  Lock,
  ShieldAlert,
  ChevronLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LogIn,
  UserPlus
} from 'lucide-react';
// Import new profile icons
import { 
  User, Shield, Bell, Moon, Globe, Share2, FileText, HelpCircle, 
  LogOut, ChevronRight, QrCode, Smartphone, Download, Trash2 
} from './components/Icons';

import { Transaction, TransactionType, Category, PaymentMethod, UserSettings } from './types';
import * as Storage from './services/storageService';
import * as GeminiService from './services/geminiService';
import { CategoryIcon, PaymentIcon } from './components/Icons';

// --- Constants & Config ---
const PRIMARY_COLOR = '#00A651'; // Emerald Green (Ivory Coast Flag)
const SECONDARY_COLOR = '#FF6B00'; // Deep Orange
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Validation Constants
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 10000000; // 10 Million CFA
const BIOMETRIC_THRESHOLD = 100000; // 100k CFA triggers bio
const TONTINE_LIMIT = 50000; // Example rule for Tontine

// --- Sub-Components ---

const Toast = ({ show, message, type = 'success' }: { show: boolean, message: string, type?: 'success' | 'error' }) => (
  <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 transition-all duration-300 z-[100] ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'} ${type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-900 text-white'}`}>
    <div className={`${type === 'error' ? 'bg-white/20' : 'bg-emerald-500'} rounded-full p-1`}>
      {type === 'error' ? <ShieldAlert size={14} strokeWidth={3} /> : <Check size={14} strokeWidth={3} />}
    </div>
    <span className="font-medium text-sm">{message}</span>
  </div>
);

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-between items-center z-50 md:max-w-md md:mx-auto safe-area-pb">
    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 ${activeTab === 'home' ? 'text-emerald-600' : 'text-gray-400'}`}>
      <LayoutDashboard size={24} />
      <span className="text-xs mt-1">Accueil</span>
    </button>
    <button onClick={() => setActiveTab('budgets')} className={`flex flex-col items-center p-2 ${activeTab === 'budgets' ? 'text-emerald-600' : 'text-gray-400'}`}>
      <Wallet size={24} />
      <span className="text-xs mt-1">Budgets</span>
    </button>
    <div className="relative -top-6">
      <button 
        onClick={() => setActiveTab('add')}
        className="w-16 h-16 rounded-full bg-orange-500 shadow-lg shadow-orange-500/30 flex items-center justify-center text-white transform transition-transform active:scale-95"
      >
        <Plus size={32} strokeWidth={3} />
      </button>
    </div>
    <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center p-2 ${activeTab === 'stats' ? 'text-emerald-600' : 'text-gray-400'}`}>
      <ChartIcon size={24} />
      <span className="text-xs mt-1">Bilans</span>
    </button>
    <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-2 ${activeTab === 'settings' ? 'text-emerald-600' : 'text-gray-400'}`}>
      <Settings size={24} />
      <span className="text-xs mt-1">Profil</span>
    </button>
  </div>
);

const TransactionCard: React.FC<{ transaction: Transaction }> = ({ transaction }) => (
  <div className="bg-white rounded-xl p-4 mb-3 flex items-center justify-between shadow-sm border border-gray-100">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === TransactionType.INCOME ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
        <CategoryIcon category={transaction.category} />
      </div>
      <div>
        <p className="font-semibold text-gray-800 text-sm">{transaction.category}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <PaymentIcon method={transaction.paymentMethod} />
          <span>{transaction.note || transaction.paymentMethod}</span>
        </div>
      </div>
    </div>
    <div className="text-right">
      <p className={`font-bold ${transaction.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-gray-800'}`}>
        {transaction.type === TransactionType.INCOME ? '+' : '-'}{transaction.amount.toLocaleString()} F
      </p>
      <p className="text-xs text-gray-400">
        {new Date(transaction.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
      </p>
    </div>
  </div>
);

// Profile Helper Components
const ProfileMenuItem = ({ 
  icon: Icon, 
  label, 
  subLabel, 
  onClick, 
  isDestructive = false,
  disabled = false
}: { 
  icon: any, 
  label: string, 
  subLabel?: string, 
  onClick: () => void, 
  isDestructive?: boolean,
  disabled?: boolean
}) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-gray-100 active:scale-[0.98] transition-transform mb-3 ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
        <Icon size={20} />
      </div>
      <div className="text-left">
        <p className={`font-semibold text-sm ${isDestructive ? 'text-red-500' : 'text-gray-800'}`}>{label}</p>
        {subLabel && <p className="text-xs text-gray-400">{subLabel}</p>}
      </div>
    </div>
    {!disabled && <ChevronRight size={18} className="text-gray-300" />}
  </button>
);

const ProfileToggle = ({ 
  label, 
  checked, 
  onChange,
  icon: Icon,
  disabled = false
}: { 
  label: string, 
  checked: boolean, 
  onChange: (c: boolean) => void,
  icon: any,
  disabled?: boolean
}) => (
  <div className={`w-full bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-gray-100 mb-3 ${disabled ? 'opacity-50' : ''}`}>
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
        <Icon size={20} />
      </div>
      <p className="font-semibold text-gray-800 text-sm">{label}</p>
    </div>
    <div 
      onClick={() => !disabled && onChange(!checked)}
      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  </div>
);

// --- Helper Functions ---
const formatNumberWithSpaces = (value: string) => {
  return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const parseNumberFromSpaces = (value: string) => {
  return parseInt(value.replace(/\s/g, ''), 10) || 0;
};

// --- Main App Component ---

export default function App() {
  // Auth State
  const [authStep, setAuthStep] = useState<'landing' | 'login' | 'register' | 'app'>('landing');
  
  // App State
  const [activeTab, setActiveTab] = useState('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<UserSettings>(Storage.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile Navigation State
  const [profileView, setProfileView] = useState<'main' | 'personal' | 'accounts' | 'security' | 'data' | 'qr'>('main');
  const [isLoadingExport, setIsLoadingExport] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });
  
  // Add Transaction State
  const [amountDisplay, setAmountDisplay] = useState(''); // Stores "5 000"
  const [category, setCategory] = useState<string>(Category.FOOD);
  const [note, setNote] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  
  // Validation State
  const [inputError, setInputError] = useState<string | null>(null);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<Transaction | null>(null);

  // AI State
  const [aiInput, setAiInput] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<string>('');

  // Budget Edit State
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [newBudgetLimit, setNewBudgetLimit] = useState('');

  // Auth Form State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);

  // Initial Load
  useEffect(() => {
    // Check Auth Status on Mount
    const savedSettings = Storage.getSettings();
    if (savedSettings.onboarded) {
      if (savedSettings.isGuest) {
        // Auto-login for guests
        setAuthStep('app');
      } else {
        // If user exists and not guest, go to login
        setAuthStep('login');
        setLoginPhone(savedSettings.phone);
      }
    } else {
      setAuthStep('landing');
    }

    const data = Storage.getTransactions();
    setTransactions(data);
    
    const budgets = Storage.getBudgets();
    setBudgetLimits(budgets);
    
    // Get AI Advice occasionally
    if (data.length > 0) {
      const summary = data.slice(0, 5).map(t => `${t.type === 'INCOME' ? 'Revenu' : 'Dépense'} de ${t.amount}F pour ${t.category}`).join(', ');
      GeminiService.getFinancialAdvice(summary).then(setCoachAdvice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Auth Handlers ---
  const handleLogin = () => {
    if (loginPin === settings.pin) { // Simple mock auth
      setAuthStep('app');
    } else {
      showToastMsg('Code PIN incorrect', 'error');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleRegister = () => {
    if (!loginPhone || !loginPin || !registerName) {
      showToastMsg('Remplissez tous les champs', 'error');
      return;
    }
    // Save new user
    const newSettings: UserSettings = {
      ...settings,
      name: registerName,
      phone: loginPhone,
      pin: loginPin,
      onboarded: true,
      isGuest: false
    };
    Storage.saveSettings(newSettings);
    setSettings(newSettings);
    setAuthStep('app');
    showToastMsg('Bienvenue sur BudgetIvoire !');
  };

  const handleGuestLogin = () => {
    const guestSettings: UserSettings = {
      ...settings,
      name: 'Invité',
      phone: '',
      pin: '',
      onboarded: true,
      isGuest: true,
      city: 'Abidjan' // Default
    };
    Storage.saveSettings(guestSettings);
    setSettings(guestSettings);
    setAuthStep('app');
    showToastMsg('Mode Invité activé');
  };

  const handleLogout = () => {
    setLoginPin('');
    // If guest, maybe we want to keep data but show landing? 
    // For now, logout goes to login if user exists, or landing if we reset everything.
    // Let's just go to landing for Guest.
    if (settings.isGuest) {
      // Optional: Clear data for guests? Or keep it?
      // Keeping it fits "Offline first" req.
      setAuthStep('landing');
    } else {
      setAuthStep('login');
    }
  };

  // --- Calculations ---
  const totalBalance = transactions.reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);
  
  const monthlyExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  const getMonthlySpent = (cat: string) => {
    const now = new Date();
    return transactions
      .filter(t => {
        if (t.type !== TransactionType.EXPENSE || t.category !== cat) return false;
        const tDate = new Date(t.date);
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      })
      .reduce((acc, t) => acc + t.amount, 0);
  };

  // --- Handlers ---

  const showToastMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    Storage.saveSettings(newSettings);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericVal = parseNumberFromSpaces(rawValue);
    
    // Max length constraint
    if (numericVal > MAX_AMOUNT) {
       setInputError(`Max autorisé: ${MAX_AMOUNT.toLocaleString()} F`);
       setIsShaking(true);
       setTimeout(() => setIsShaking(false), 500);
       return; 
    } else {
      setInputError(null);
    }

    setAmountDisplay(formatNumberWithSpaces(rawValue));

    // Live Budget Check
    if (type === TransactionType.EXPENSE) {
       const limit = budgetLimits[category] || 0;
       if (limit > 0) {
         const currentSpent = getMonthlySpent(category);
         if (currentSpent + numericVal > limit) {
           setBudgetWarning(`Attention : Vous dépassez votre budget de ${(currentSpent + numericVal - limit).toLocaleString()} F`);
         } else {
           setBudgetWarning(null);
         }
       }
    }
  };

  const validateTransaction = (): boolean => {
    const amount = parseNumberFromSpaces(amountDisplay);
    
    // 1. Basic Format
    if (amount < MIN_AMOUNT) {
      setInputError(`Minimum ${MIN_AMOUNT} F requis`);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return false;
    }

    // 2. Tontine Rule (Business Logic)
    if (category === Category.TONTINE && type === TransactionType.EXPENSE && amount > TONTINE_LIMIT) {
       if (!window.confirm(`Règle Tontine : La cotisation habituelle est max ${TONTINE_LIMIT} F. Confirmer ?`)) {
         return false;
       }
    }

    // 3. Balance Integrity (Server-side validation simulation)
    if (type === TransactionType.EXPENSE && amount > totalBalance) {
      setInputError("Solde insuffisant pour cette opération !");
      showToastMsg("Fonds insuffisants", "error");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return false;
    }

    return true;
  };

  const initSaveTransaction = () => {
    if (!validateTransaction()) return;

    const amount = parseNumberFromSpaces(amountDisplay);
    
    // Create transaction object
    const newTx: Transaction = {
      id: Date.now().toString(),
      amount: amount,
      category,
      type,
      paymentMethod,
      note: note.trim(), // Sanitize: trim whitespace
      date: new Date().toISOString()
    };

    // 4. Biometric Check for High Amounts
    // Only check biometrics if enabled and NOT guest
    if (amount >= BIOMETRIC_THRESHOLD && type === TransactionType.EXPENSE && !settings.isGuest && settings.biometricEnabled) {
      setPendingTransaction(newTx);
      setShowBiometric(true);
      return;
    }

    finalizeSave(newTx);
  };

  const finalizeSave = (tx: Transaction) => {
    const updated = Storage.saveTransaction(tx);
    setTransactions(updated);
    
    // Reset form
    setAmountDisplay('');
    setNote('');
    setReceiptImage(null);
    setCategory(Category.FOOD);
    setBudgetWarning(null);
    setInputError(null);
    
    // Navigate home and show toast
    setActiveTab('home');
    showToastMsg("Opération enregistrée !");
  };

  const handleBiometricConfirm = () => {
    // Simulate biometric delay
    setTimeout(() => {
      if (pendingTransaction) {
        finalizeSave(pendingTransaction);
        setShowBiometric(false);
        setPendingTransaction(null);
      }
    }, 1500);
  };

  const handleAiParse = async () => {
    if (!aiInput) return;
    setIsLoading(true);
    const result = await GeminiService.parseVoiceInput(aiInput);
    setIsLoading(false);
    
    if (result) {
      setAmountDisplay(formatNumberWithSpaces(result.amount.toString()));
      setNote(result.note);
      if (result.category) {
        const match = Object.values(Category).find(c => c.toLowerCase().includes(result.category.toLowerCase()));
        setCategory(match || Category.OTHER);
      }
      if (result.type) setType(result.type as TransactionType);
      
      setShowAiModal(false);
      setAiInput('');
    } else {
      alert("Je n'ai pas bien compris. Essaye '5000 pour le marché'.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      updateSetting('photo', url);
    }
  };

  const handleSaveBudget = () => {
    if (editingBudget && newBudgetLimit) {
      const updated = Storage.saveBudget(editingBudget, parseInt(newBudgetLimit));
      setBudgetLimits(updated);
      setEditingBudget(null);
      setNewBudgetLimit('');
    }
  };

  const handleExportData = (type: 'PDF' | 'Excel') => {
    setIsLoadingExport(true);
    setTimeout(() => {
      setIsLoadingExport(false);
      showToastMsg(`Rapport ${type} téléchargé !`);
    }, 2000);
  };

  // Chart Data
  const expensesByCategory = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  
  const pieData = Object.keys(expensesByCategory).map((key) => ({
    name: key,
    value: expensesByCategory[key]
  }));

  const getCategoryTrendData = (categoryName: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const relevantTransactions = transactions.filter(t => 
      t.category === categoryName && 
      t.type === TransactionType.EXPENSE &&
      new Date(t.date).getMonth() === currentMonth &&
      new Date(t.date).getFullYear() === currentYear
    );

    const dailyTotals: Record<number, number> = {};
    relevantTransactions.forEach(t => {
      const day = new Date(t.date).getDate();
      dailyTotals[day] = (dailyTotals[day] || 0) + t.amount;
    });

    const data = [];
    let cumulative = 0;
    const today = now.getDate();
    
    for (let i = 1; i <= today; i++) {
      if (dailyTotals[i]) {
        cumulative += dailyTotals[i];
      }
      data.push({ day: i.toString(), amount: cumulative });
    }
    
    if (data.length === 0) data.push({ day: '1', amount: 0 });

    return data;
  };

  // --- Views ---

  const renderLanding = () => (
    <div className="h-screen bg-gradient-to-b from-emerald-600 to-emerald-800 flex flex-col items-center justify-between p-8 text-white animate-fade-in relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-20%] w-96 h-96 rounded-full bg-orange-500 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-20%] w-96 h-96 rounded-full bg-yellow-400 blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
        <div className="bg-white/20 p-6 rounded-3xl mb-8 backdrop-blur-md shadow-lg">
          <Wallet size={64} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-2">BudgetIvoire</h1>
        <p className="text-emerald-100 text-lg mb-8">Gère tes gombos simplement.</p>
        
        <div className="space-y-4 w-full">
           <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
             <div className="bg-orange-500 p-2 rounded-full"><Check size={16} /></div>
             <p className="text-sm font-medium">100% Hors-ligne</p>
           </div>
           <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
             <div className="bg-orange-500 p-2 rounded-full"><Mic size={16} /></div>
             <p className="text-sm font-medium">Assistant Vocal</p>
           </div>
           <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
             <div className="bg-orange-500 p-2 rounded-full"><Shield size={16} /></div>
             <p className="text-sm font-medium">Sécurisé & Local</p>
           </div>
        </div>
      </div>

      <div className="w-full z-10 space-y-4">
        <button 
          onClick={() => setAuthStep('register')}
          className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl shadow-xl hover:bg-orange-600 transition-transform active:scale-95"
        >
          Créer un compte
        </button>
        <button 
          onClick={() => setAuthStep('login')}
          className="w-full bg-transparent border-2 border-white text-white font-bold py-4 rounded-xl hover:bg-white/10 transition-transform active:scale-95"
        >
          J'ai déjà un compte
        </button>
        <button 
          onClick={handleGuestLogin}
          className="w-full text-white/80 text-sm font-medium underline py-2 hover:text-white transition-colors"
        >
          Continuer sans compte (Mode Invité)
        </button>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="h-screen bg-gray-50 flex flex-col p-6 animate-slide-in">
       <button onClick={() => setAuthStep('landing')} className="mb-8 w-fit p-2 bg-white rounded-full shadow-sm">
         <ChevronLeft size={24} className="text-gray-600" />
       </button>
       
       <div className="flex-1 flex flex-col justify-center">
         <div className="text-center mb-10">
           <div className="inline-block p-4 bg-emerald-100 rounded-full text-emerald-600 mb-4">
             {authStep === 'register' ? <UserPlus size={40} /> : <Lock size={40} />}
           </div>
           <h2 className="text-3xl font-bold text-gray-900 mb-2">
             {authStep === 'register' ? "Nouveau Compte" : "Bon retour !"}
           </h2>
           <p className="text-gray-500">
             {authStep === 'register' ? "Quelques infos pour commencer." : "Entre ton code pour accéder à ton budget."}
           </p>
         </div>

         <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 space-y-6">
            
            {/* Register: Name Field */}
            {authStep === 'register' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nom complet</label>
                <div className="flex items-center border-b-2 border-gray-200 py-2 focus-within:border-emerald-500 transition-colors">
                  <User size={20} className="text-gray-400 mr-3" />
                  <input 
                    type="text" 
                    placeholder="Ex: Kouassi Jean"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="w-full outline-none text-lg font-medium text-gray-800"
                  />
                </div>
              </div>
            )}

            {/* Phone Field */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Numéro Mobile</label>
              <div className="flex items-center border-b-2 border-gray-200 py-2 focus-within:border-emerald-500 transition-colors">
                <span className="text-gray-400 mr-2 font-bold text-lg">+225</span>
                <input 
                  type="tel" 
                  placeholder="07 00 00 00 00"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(formatNumberWithSpaces(e.target.value))}
                  className="w-full outline-none text-lg font-medium text-gray-800"
                />
              </div>
            </div>

            {/* PIN Field */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Code PIN (4 chiffres)</label>
              <div className="flex items-center border-b-2 border-gray-200 py-2 focus-within:border-emerald-500 transition-colors">
                <Lock size={20} className="text-gray-400 mr-3" />
                <input 
                  type={showPin ? "text" : "password"}
                  maxLength={4}
                  placeholder="••••"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                  className={`w-full outline-none text-lg font-medium text-gray-800 tracking-[0.5em] ${isShaking ? 'text-red-500' : ''}`}
                />
                <button onClick={() => setShowPin(!showPin)} className="text-gray-400">
                  {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              onClick={authStep === 'register' ? handleRegister : handleLogin}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <LogIn size={20} />
              {authStep === 'register' ? "S'inscrire" : "Connexion"}
            </button>
         </div>

         {authStep === 'login' && (
           <p className="text-center mt-6 text-sm text-gray-500">
             Code PIN oublié ? <span className="text-orange-500 font-bold">Contactez le support</span>
           </p>
         )}
         
         {authStep === 'login' && (
            <button onClick={() => setAuthStep('register')} className="mt-4 text-center text-sm font-semibold text-emerald-600">
               Pas encore de compte ? Créer maintenant
            </button>
         )}
       </div>
    </div>
  );

  // ... Original Views (Home, Add, Stats, Budgets, Profile) ...
  // Wrapped in a render function to be cleaner

  const renderHome = () => (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-emerald-600 p-6 pt-10 rounded-b-3xl shadow-lg text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-emerald-100 text-sm">Solde total</p>
              {settings.isGuest && <span className="bg-orange-500 text-[10px] px-2 py-0.5 rounded-full font-bold">INVITÉ</span>}
            </div>
            <h1 className="text-4xl font-bold mt-1">{totalBalance.toLocaleString()} <span className="text-lg font-normal">FCFA</span></h1>
          </div>
          
          <button onClick={() => { setActiveTab('settings'); setProfileView('qr'); }} className="bg-white/10 p-2 rounded-xl backdrop-blur-sm active:bg-white/20 transition-colors">
            {settings.photo ? (
              <img src={settings.photo} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
            ) : (
              <User size={24} className="text-white" />
            )}
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-emerald-700/50 p-3 rounded-xl backdrop-blur-sm flex items-center gap-2">
            <div className="bg-red-100 p-1.5 rounded-full text-red-600"><TrendingDown size={16} /></div>
            <div>
              <p className="text-xs text-emerald-100">Dépenses</p>
              <p className="font-semibold text-sm">{monthlyExpense.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex-1 bg-emerald-700/50 p-3 rounded-xl backdrop-blur-sm flex items-center gap-2">
            <div className="bg-green-100 p-1.5 rounded-full text-green-600"><TrendingUp size={16} /></div>
            <div>
              <p className="text-xs text-emerald-100">Revenus</p>
              <p className="font-semibold text-sm">{(totalBalance + monthlyExpense).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Coach Tip */}
      {coachAdvice && (
        <div className="mx-4 mt-4 bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3 shadow-sm">
          <div className="bg-orange-100 p-2 h-fit rounded-full text-orange-600 shrink-0">
            <Mic size={20} />
          </div>
          <div>
            <h3 className="font-bold text-orange-800 text-sm mb-1">Conseil du Coach</h3>
            <p className="text-xs text-gray-700 italic">"{coachAdvice}"</p>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-800">Récemment</h2>
          <button onClick={() => setActiveTab('stats')} className="text-xs text-emerald-600 font-semibold">Voir tout</button>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
            <p>Aucune dépense encore.</p>
            <p className="text-sm">Appuie sur + pour commencer !</p>
          </div>
        ) : (
          transactions.slice(0, 5).map(t => <TransactionCard key={t.id} transaction={t} />)
        )}
      </div>
    </div>
  );

  const renderAdd = () => (
    <div className="pb-24 p-4 pt-10 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nouvelle opération</h2>

      {/* Manual Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-y-auto no-scrollbar">
        
        {/* Type Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button 
            onClick={() => { setType(TransactionType.EXPENSE); setInputError(null); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500'}`}
          >
            Dépense
          </button>
          <button 
            onClick={() => { setType(TransactionType.INCOME); setInputError(null); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-white text-emerald-500 shadow-sm' : 'text-gray-500'}`}
          >
            Revenu
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-6 relative">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Montant (FCFA)</label>
          <div className={`relative transition-transform ${isShaking ? 'translate-x-[-5px] duration-100' : ''}`}>
             <input 
              type="text" 
              inputMode="numeric"
              value={amountDisplay}
              onChange={handleAmountChange}
              placeholder="0" 
              autoFocus
              className={`w-full text-5xl font-bold text-gray-800 border-b-2 outline-none py-2 bg-transparent ${inputError ? 'border-red-500 text-red-600' : 'border-gray-200 focus:border-emerald-500'}`}
            />
            {inputError && (
              <span className="absolute right-0 top-4 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                {inputError}
              </span>
            )}
          </div>
          {/* Budget Warning */}
          {budgetWarning && type === TransactionType.EXPENSE && (
             <div className="mt-2 flex items-center gap-2 text-xs font-medium text-orange-600 bg-orange-50 p-2 rounded-lg animate-pulse">
               <AlertCircle size={14} />
               {budgetWarning}
             </div>
          )}
        </div>

        {/* Category Grid */}
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">Catégorie</label>
        <div className="grid grid-cols-2 gap-2 mb-8">
          {Object.values(Category).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
              }}
              className={`p-3 rounded-xl text-xs text-left border flex items-center gap-3 transition-colors ${category === cat ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}
            >
              <CategoryIcon category={cat} className="w-5 h-5 shrink-0" />
              <span className="truncate font-medium">{cat}</span>
            </button>
          ))}
        </div>

        {/* Payment Method - GRID LAYOUT */}
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">Paiement via</label>
        <div className="grid grid-cols-3 gap-2 mb-8">
          {Object.values(PaymentMethod).map((method) => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`p-2.5 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-2 transition-all h-20 text-center ${paymentMethod === method ? 'border-orange-500 bg-orange-50 text-orange-800 ring-1 ring-orange-500' : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}
            >
              <PaymentIcon method={method} />
              <span className="leading-tight">{method}</span>
            </button>
          ))}
        </div>

        {/* Extra: Note & Camera */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Note (Optionnel)</label>
            <input 
              type="text" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Pain, Taxi..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          
          {/* Camera Button */}
          <div>
             <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              onChange={handleFileChange}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`w-12 h-11 rounded-lg border flex items-center justify-center transition-colors ${receiptImage ? 'bg-emerald-100 border-emerald-500 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}
            >
              {receiptImage ? <ImageIcon size={20} /> : <Camera size={20} />}
            </button>
          </div>
        </div>
        
        {receiptImage && (
          <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
            <Check size={12} /> Reçu ajouté
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-3">
        <button 
          onClick={initSaveTransaction}
          disabled={!!inputError || !amountDisplay}
          className={`w-full font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${inputError || !amountDisplay ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 text-white'}`}
        >
          <Check size={20} />
          Valider {parseNumberFromSpaces(amountDisplay) > 0 ? formatNumberWithSpaces(amountDisplay) + ' F' : ''}
        </button>
        
        <button 
          onClick={() => setShowAiModal(true)}
          className="w-full bg-white text-emerald-600 font-medium py-3 rounded-xl border border-emerald-100 flex items-center justify-center gap-2"
        >
          <Mic size={18} />
          Saisie vocale IA
        </button>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="pb-24 pt-10 px-4 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Analyses</h2>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 h-80 flex flex-col items-center justify-center">
        <h3 className="text-gray-500 text-sm mb-4">Répartition des dépenses</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value: number) => `${value.toLocaleString()} F`} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-sm">Pas assez de données</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-gray-800">Détails</h3>
        {Object.keys(expensesByCategory).map((cat, idx) => (
          <div key={cat} className="bg-white p-4 rounded-xl flex items-center justify-between border-l-4" style={{borderLeftColor: COLORS[idx % COLORS.length]}}>
             <div className="flex items-center gap-3">
               <div className="bg-gray-100 p-2 rounded-full text-gray-600">
                 <CategoryIcon category={cat} />
               </div>
               <span className="font-medium text-gray-700">{cat}</span>
             </div>
             <span className="font-bold text-gray-800">{expensesByCategory[cat].toLocaleString()} F</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBudgets = () => (
    <div className="pb-24 pt-10 px-4 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Budgets Mensuels</h2>
        <Target className="text-emerald-600" />
      </div>
      <p className="text-sm text-gray-500 mb-6">Gère tes limites pour ne pas te ruiner.</p>

      <div className="space-y-4">
        {Object.values(Category).map((cat) => {
          const limit = budgetLimits[cat] || 0;
          const spent = getMonthlySpent(cat);
          const percent = limit > 0 ? (spent / limit) * 100 : 0;
          
          let colorClass = 'bg-emerald-500';
          if (percent > 100) colorClass = 'bg-red-500';
          else if (percent > 80) colorClass = 'bg-orange-500';
          else if (percent > 60) colorClass = 'bg-yellow-400';

          return (
            <div 
              key={cat} 
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => {
                setEditingBudget(cat);
                setNewBudgetLimit(limit ? limit.toString() : '');
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${percent > 100 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <CategoryIcon category={cat} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{cat}</h4>
                    {limit > 0 ? (
                      <p className="text-xs text-gray-500">{spent.toLocaleString()} / {limit.toLocaleString()} F</p>
                    ) : (
                      <p className="text-xs text-gray-400">Pas de limite définie</p>
                    )}
                  </div>
                </div>
                {limit > 0 && (
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${percent > 100 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                )}
                {limit === 0 && <Pencil size={16} className="text-gray-300" />}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`} 
                  style={{ width: `${Math.min(percent, 100)}%` }}
                ></div>
              </div>
              
              {percent > 100 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-red-500 font-medium">
                  <AlertCircle size={12} />
                  <span>Attention ! Budget dépassé.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-gray-800">Détails Budget</h3>
              <button onClick={() => setEditingBudget(null)}><X className="text-gray-400" /></button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">Suivi pour <span className="font-bold text-emerald-600">{editingBudget}</span></p>

            {/* CHART */}
            <div className="h-48 w-full mb-6 bg-gray-50 rounded-xl p-2 border border-gray-100">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={getCategoryTrendData(editingBudget)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="day" 
                      tick={{fontSize: 10, fill: '#9ca3af'}} 
                      axisLine={false} 
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis hide domain={[0, 'auto']} />
                    <RechartsTooltip 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      formatter={(value: number) => [`${value.toLocaleString()} F`, 'Dépensé']}
                    />
                    {/* Budget Limit Line */}
                    {budgetLimits[editingBudget] > 0 && (
                      <ReferenceLine 
                        y={budgetLimits[editingBudget]} 
                        stroke="#EF4444" 
                        strokeDasharray="3 3" 
                        label={{ position: 'insideTopRight', value: 'Limite', fill: '#EF4444', fontSize: 10 }} 
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#00A651" 
                      strokeWidth={3} 
                      dot={{r: 0}} 
                      activeDot={{r: 4, fill: '#00A651'}} 
                    />
                 </LineChart>
               </ResponsiveContainer>
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Modifier la limite mensuelle</p>
            <input 
              type="number" 
              value={newBudgetLimit}
              onChange={(e) => setNewBudgetLimit(e.target.value)}
              placeholder="Ex: 50000"
              className="w-full text-3xl font-bold text-center border-b-2 border-emerald-500 outline-none py-2 mb-6 text-gray-800 bg-transparent"
            />
            
            <button 
              onClick={handleSaveBudget}
              className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // --- Profile Sub-Views ---

  const renderProfileMain = () => (
    <div className="pb-24 animate-fade-in">
       {/* Profile Header */}
       <div className="bg-emerald-600 p-6 pt-12 rounded-b-3xl shadow-lg text-white mb-6">
         <div className="flex items-center gap-4">
           <div className="relative">
             <input type="file" ref={profilePhotoRef} className="hidden" accept="image/*" onChange={handleProfilePhotoChange} />
             <div onClick={() => !settings.isGuest && profilePhotoRef.current?.click()} className="w-20 h-20 rounded-full border-4 border-white/30 bg-white/20 flex items-center justify-center overflow-hidden cursor-pointer">
               {settings.photo ? (
                 <img src={settings.photo} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <User size={40} className="text-white" />
               )}
             </div>
             {!settings.isGuest && (
               <div className="absolute bottom-0 right-0 bg-orange-500 p-1.5 rounded-full border border-white">
                 <Camera size={12} className="text-white" />
               </div>
             )}
           </div>
           <div>
             <h1 className="text-2xl font-bold">{settings.name}</h1>
             <p className="text-emerald-100 text-sm">{settings.city}</p>
             {settings.isGuest ? (
               <button onClick={() => setAuthStep('register')} className="mt-2 text-xs bg-orange-500 text-white px-3 py-1 rounded-full flex items-center gap-1 hover:bg-orange-600 transition shadow-sm font-bold">
                 <UserPlus size={12} /> Créer un compte
               </button>
             ) : (
               <button onClick={() => setProfileView('qr')} className="mt-2 text-xs bg-white/20 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-white/30 transition">
                 <QrCode size={12} /> Mon Code QR
               </button>
             )}
           </div>
         </div>
       </div>

       {settings.isGuest && (
         <div className="px-4 mb-6">
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3">
               <AlertCircle size={20} className="text-orange-500 shrink-0" />
               <div>
                 <p className="font-bold text-gray-800 text-sm">Mode Invité</p>
                 <p className="text-xs text-gray-600">Vos données sont stockées sur ce téléphone. Créez un compte pour ne rien perdre.</p>
               </div>
            </div>
         </div>
       )}

       {/* Menu List */}
       <div className="px-4 space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase ml-2 mb-2">Compte</p>
          <ProfileMenuItem 
            icon={User} 
            label="Infos personnelles" 
            subLabel="Nom, ville, téléphone" 
            onClick={() => setProfileView('personal')} 
          />
          <ProfileMenuItem 
            icon={Smartphone} 
            label="Comptes liés" 
            subLabel="Orange, MTN, Wave..." 
            onClick={() => setProfileView('accounts')}
            disabled={!!settings.isGuest}
          />
          
          <p className="text-xs font-bold text-gray-400 uppercase ml-2 mb-2 mt-6">Sécurité & App</p>
          <ProfileMenuItem 
            icon={Shield} 
            label="Sécurité" 
            subLabel="PIN, Biométrie" 
            onClick={() => setProfileView('security')} 
            disabled={!!settings.isGuest}
          />
          <ProfileToggle 
             icon={Moon}
             label="Mode sombre"
             checked={settings.darkMode}
             onChange={(v) => updateSetting('darkMode', v)}
          />
          <ProfileToggle 
             icon={Bell}
             label="Notifications"
             checked={settings.notificationsEnabled}
             onChange={(v) => updateSetting('notificationsEnabled', v)}
          />

          <p className="text-xs font-bold text-gray-400 uppercase ml-2 mb-2 mt-6">Données & Aide</p>
          <ProfileMenuItem 
            icon={FileText} 
            label="Rapports & Données" 
            subLabel="Export PDF, Excel, Backup" 
            onClick={() => setProfileView('data')} 
          />
          <ProfileMenuItem 
            icon={HelpCircle} 
            label="Aide & Support" 
            subLabel="FAQ, WhatsApp" 
            onClick={() => window.open('https://wa.me/', '_blank')} 
          />
          <ProfileMenuItem 
            icon={LogOut} 
            label={settings.isGuest ? "Quitter le mode invité" : "Déconnexion"}
            isDestructive={true}
            onClick={() => { if(confirm(settings.isGuest ? 'Vos données pourraient être perdues si vous changez de téléphone. Continuer ?' : 'Se déconnecter ?')) handleLogout(); }} 
          />
       </div>
    </div>
  );

  const renderProfileSubHeader = (title: string) => (
    <div className="flex items-center gap-3 mb-6">
      <button onClick={() => setProfileView('main')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
        <ChevronLeft size={20} className="text-gray-600" />
      </button>
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    </div>
  );

  const renderProfilePersonal = () => (
    <div className="pt-10 px-4 pb-24 h-full flex flex-col animate-slide-in">
      {renderProfileSubHeader('Infos Personnelles')}
      
      <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom complet</label>
          <input 
            type="text" 
            value={settings.name} 
            onChange={(e) => updateSetting('name', e.target.value)}
            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ville</label>
          <input 
            type="text" 
            value={settings.city} 
            onChange={(e) => updateSetting('city', e.target.value)}
            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Téléphone</label>
          <input 
            type="tel" 
            value={settings.phone} 
            onChange={(e) => updateSetting('phone', e.target.value)}
            disabled={!!settings.isGuest}
            placeholder={settings.isGuest ? "Non disponible" : ""}
            className={`w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium ${settings.isGuest ? 'opacity-50' : ''}`}
          />
        </div>
         <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Langue</label>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => updateSetting('language', 'fr')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.language === 'fr' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
            >
              Français
            </button>
            <button 
              onClick={() => updateSetting('language', 'dioula')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.language === 'dioula' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
            >
              Dioula
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileAccounts = () => (
    <div className="pt-10 px-4 pb-24 animate-slide-in">
      {renderProfileSubHeader('Comptes Liés')}
      <p className="text-sm text-gray-500 mb-6">Active les services que tu utilises pour scanner rapidement tes transactions.</p>
      
      {[
        { id: 'ORANGE_MONEY', label: 'Orange Money', icon: PaymentMethod.ORANGE_MONEY },
        { id: 'MTN_MOMO', label: 'MTN MoMo', icon: PaymentMethod.MTN_MOMO },
        { id: 'WAVE', label: 'Wave', icon: PaymentMethod.WAVE },
        { id: 'MOOV', label: 'Moov Money', icon: PaymentMethod.MOOV },
        { id: 'BANK', label: 'Banque (Carte)', icon: PaymentMethod.BANK },
      ].map((acc) => (
         <div key={acc.id} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-gray-100 mb-3">
            <div className="flex items-center gap-3">
              <PaymentIcon method={acc.icon} />
              <span className="font-semibold text-gray-700">{acc.label}</span>
            </div>
            <div 
              onClick={() => {
                const current = settings.linkedAccounts || [];
                const newAccounts = current.includes(acc.id) 
                  ? current.filter(id => id !== acc.id) 
                  : [...current, acc.id];
                updateSetting('linkedAccounts', newAccounts);
              }}
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.linkedAccounts?.includes(acc.id) ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.linkedAccounts?.includes(acc.id) ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
         </div>
      ))}
    </div>
  );

  const renderProfileSecurity = () => (
    <div className="pt-10 px-4 pb-24 animate-slide-in">
      {renderProfileSubHeader('Sécurité')}
      
      <div className="space-y-4">
        <ProfileToggle 
          icon={Fingerprint}
          label="Biométrie (FaceID / TouchID)"
          checked={settings.biometricEnabled}
          onChange={(v) => updateSetting('biometricEnabled', v)}
        />
        
        <button className="w-full bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-gray-100">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Lock size={20} />
              </div>
              <p className="font-semibold text-gray-800 text-sm">Changer Code PIN</p>
           </div>
           <ChevronRight size={18} className="text-gray-300" />
        </button>
      </div>
    </div>
  );

  const renderProfileData = () => (
    <div className="pt-10 px-4 pb-24 animate-slide-in">
      {renderProfileSubHeader('Mes Données')}
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 text-center">
         <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
           <Download size={32} />
         </div>
         <h3 className="font-bold text-gray-800 mb-2">Exporter l'historique</h3>
         <p className="text-xs text-gray-500 mb-6">Télécharge tes transactions pour les imprimer ou les analyser sur Excel.</p>
         
         <div className="flex gap-3">
           <button 
             onClick={() => handleExportData('PDF')}
             disabled={isLoadingExport}
             className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform text-sm"
           >
             {isLoadingExport ? '...' : 'PDF'}
           </button>
           <button 
             onClick={() => handleExportData('Excel')}
             disabled={isLoadingExport}
             className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform text-sm"
           >
             {isLoadingExport ? '...' : 'Excel'}
           </button>
         </div>
      </div>

      <button className="w-full bg-white p-4 rounded-xl flex items-center gap-4 text-red-500 border border-red-100 shadow-sm">
         <Trash2 size={20} />
         <span className="font-semibold text-sm">Supprimer mon compte & données</span>
      </button>
    </div>
  );

  const renderProfileQR = () => (
    <div className="pt-10 px-4 pb-24 h-full flex flex-col items-center justify-center animate-fade-in text-center">
      <div className="absolute top-10 left-4">
        <button onClick={() => setProfileView('main')} className="p-2 bg-gray-100 rounded-full">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
      </div>
      
      <div className="bg-white p-8 rounded-3xl shadow-2xl mb-8 border border-gray-100">
         <QrCode size={200} className="text-gray-900" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{settings.name}</h2>
      <p className="text-gray-500 mb-8">{settings.phone}</p>
      
      <div className="flex gap-4 w-full max-w-xs">
        <button className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
           <Share2 size={18} /> Partager
        </button>
        <button className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
           Scanner
        </button>
      </div>
    </div>
  );

  const renderProfile = () => {
    switch (profileView) {
      case 'personal': return renderProfilePersonal();
      case 'accounts': return renderProfileAccounts();
      case 'security': return renderProfileSecurity();
      case 'data': return renderProfileData();
      case 'qr': return renderProfileQR();
      default: return renderProfileMain();
    }
  };

  const renderApp = () => (
    <>
      {activeTab === 'home' && renderHome()}
      {activeTab === 'budgets' && renderBudgets()}
      {activeTab === 'add' && renderAdd()}
      {activeTab === 'stats' && renderStats()}
      {activeTab === 'settings' && renderProfile()}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );

  return (
    <div className={`min-h-screen bg-gray-50 md:max-w-md md:mx-auto font-sans text-gray-900 relative ${settings.darkMode ? 'invert' : ''}`}>
      
      {/* Toast Notification */}
      <Toast show={toast.show} message={toast.msg} type={toast.type} />

      {/* Auth Flow vs App Flow */}
      {authStep === 'landing' && renderLanding()}
      {(authStep === 'login' || authStep === 'register') && renderLogin()}
      {authStep === 'app' && renderApp()}

      {/* Biometric Simulation Modal */}
      {showBiometric && authStep === 'app' && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 animate-fade-in backdrop-blur-sm">
           <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-emerald-300"></div>
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 animate-pulse">
                <Fingerprint size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmer le gros montant</h3>
              <p className="text-gray-500 text-sm mb-8 px-4">
                Pour votre sécurité, les montants supérieurs à {BIOMETRIC_THRESHOLD.toLocaleString()} F nécessitent une vérification.
              </p>
              
              <button 
                onClick={handleBiometricConfirm}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors"
              >
                <Lock size={18} />
                Confirmer avec Face ID
              </button>
              <button 
                onClick={() => { setShowBiometric(false); setPendingTransaction(null); }}
                className="mt-4 text-gray-400 text-sm font-medium hover:text-gray-600"
              >
                Annuler
              </button>
           </div>
        </div>
      )}

      {/* AI Voice/Text Modal */}
      {showAiModal && authStep === 'app' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Assistant Intelligent</h3>
              <button onClick={() => setShowAiModal(false)} className="text-gray-400"><X /></button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Décris ta dépense simplement. <br/>
              <span className="italic text-xs text-gray-400">Ex: "J'ai payé 2000 le taxi" ou "Reçu 50000 tontine"</span>
            </p>

            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 h-24 mb-4 focus:border-emerald-500 outline-none resize-none"
              placeholder="Tape ici ou dicte..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
            />

            <button 
              onClick={handleAiParse}
              disabled={isLoading || !aiInput}
              className="w-full bg-emerald-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {isLoading ? 'Analyse...' : <><Send size={18} /> Analyser</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}