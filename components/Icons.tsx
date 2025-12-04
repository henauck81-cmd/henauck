import React from 'react';
import { 
  ShoppingBag, 
  Car, 
  Home, 
  PiggyBank, 
  Beer, 
  Activity, 
  Users, 
  MoreHorizontal,
  Wallet,
  Smartphone,
  GraduationCap,
  Banknote,
  CreditCard,
  User,
  Shield,
  Bell,
  Moon,
  Globe,
  Share2,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  QrCode,
  Download,
  Trash2
} from 'lucide-react';
import { Category, PaymentMethod } from '../types';

export const CategoryIcon = ({ category, className = "w-6 h-6" }: { category: string, className?: string }) => {
  switch (category) {
    case Category.FOOD: return <ShoppingBag className={className} />;
    case Category.TRANSPORT: return <Car className={className} />;
    case Category.HOUSING: return <Home className={className} />;
    case Category.EDUCATION: return <GraduationCap className={className} />;
    case Category.TONTINE: return <PiggyBank className={className} />;
    case Category.ENTERTAINMENT: return <Beer className={className} />;
    case Category.HEALTH: return <Activity className={className} />;
    case Category.FAMILY: return <Users className={className} />;
    default: return <MoreHorizontal className={className} />;
  }
};

export const PaymentIcon = ({ method }: { method: string }) => {
  // Icônes représentatives pour les méthodes de paiement locales
  if (method === PaymentMethod.WAVE) return (
    <div className="w-6 h-6 rounded-full bg-[#1DC0F1] flex items-center justify-center text-white font-bold text-[8px] overflow-hidden border border-blue-200 shadow-sm">
      <div className="transform scale-90 italic">W</div>
    </div>
  );
  if (method === PaymentMethod.ORANGE_MONEY) return (
    <div className="w-6 h-6 rounded bg-[#FF7900] flex items-center justify-center text-white font-bold text-[7px] border border-orange-600 shadow-sm">
      OM
    </div>
  );
  if (method === PaymentMethod.MTN_MOMO) return (
    <div className="w-6 h-6 rounded-full bg-[#FFCC00] flex items-center justify-center text-[#1D1D1D] font-bold text-[7px] border border-yellow-500 shadow-sm">
      MTN
    </div>
  );
  if (method === PaymentMethod.MOOV) return (
    <div className="w-6 h-6 rounded-full bg-[#0065A4] flex items-center justify-center text-white font-bold text-[7px] border border-blue-800 shadow-sm">
      Moov
    </div>
  );
  if (method === PaymentMethod.BANK) return <CreditCard className="w-6 h-6 text-purple-600" />;
  
  // Default Cash
  return <Banknote className="w-6 h-6 text-emerald-600" />;
};

// Exporting Lucide icons for use in App.tsx
export {
  User, Shield, Bell, Moon, Globe, Share2, FileText, HelpCircle, 
  LogOut, ChevronRight, QrCode, Smartphone, Download, Trash2
};