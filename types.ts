export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME'
}

export enum PaymentMethod {
  CASH = 'Espèces',
  ORANGE_MONEY = 'Orange Money',
  WAVE = 'Wave',
  MTN_MOMO = 'MTN MoMo',
  MOOV = 'Moov Money',
  BANK = 'Banque'
}

export enum Category {
  FOOD = 'Nourriture & Marché',
  TRANSPORT = 'Transport (Woro-woro)',
  HOUSING = 'Loyer & Électricité',
  EDUCATION = 'École & Formation',
  TONTINE = 'Tontine & Épargne',
  ENTERTAINMENT = 'Loisirs & Maquis',
  HEALTH = 'Santé & Pharmacie',
  FAMILY = 'Famille & Aides',
  OTHER = 'Autre'
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  note: string;
  date: string; // ISO string
}

export interface Budget {
  category: string;
  limit: number;
  spent: number;
}

export interface UserSettings {
  currency: string;
  name: string;
  pin: string; // Added for Auth
  onboarded: boolean;
  isGuest?: boolean; // Added for Guest Mode
  // New Profile Fields
  city: string;
  phone: string;
  photo?: string;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  darkMode: boolean;
  language: 'fr' | 'dioula';
  linkedAccounts: string[]; // IDs of linked providers
}