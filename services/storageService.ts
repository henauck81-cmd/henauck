import { Transaction, Budget, UserSettings, TransactionType, Category, PaymentMethod } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'budgetivoire_transactions',
  BUDGETS: 'budgetivoire_budgets',
  SETTINGS: 'budgetivoire_settings',
};

// Initial Mock Data
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', amount: 5000, type: TransactionType.EXPENSE, category: Category.FOOD, paymentMethod: PaymentMethod.CASH, note: 'Riz et huile', date: new Date().toISOString() },
  { id: '2', amount: 2000, type: TransactionType.EXPENSE, category: Category.TRANSPORT, paymentMethod: PaymentMethod.WAVE, note: 'Taxi compteur', date: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', amount: 50000, type: TransactionType.INCOME, category: 'Salaire', paymentMethod: PaymentMethod.ORANGE_MONEY, note: 'Business vente', date: new Date(Date.now() - 172800000).toISOString() },
];

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'FCFA',
  name: 'Kouassi Jean',
  pin: '1234', // Default PIN
  onboarded: false, // Changed to false to trigger flow if storage is empty
  isGuest: false,
  city: 'Abidjan',
  phone: '07000000',
  biometricEnabled: false,
  notificationsEnabled: true,
  darkMode: false,
  language: 'fr',
  linkedAccounts: ['ORANGE_MONEY']
};

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : INITIAL_TRANSACTIONS;
};

export const saveTransaction = (transaction: Transaction): Transaction[] => {
  const current = getTransactions();
  const updated = [transaction, ...current];
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
  return updated;
};

export const deleteTransaction = (id: string): Transaction[] => {
  const current = getTransactions();
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
  return updated;
};

export const getSettings = (): UserSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: UserSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const getBudgets = (): Record<string, number> => {
  const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
  return data ? JSON.parse(data) : {}; // Returns map of Category -> Limit
};

export const saveBudget = (category: string, limit: number): Record<string, number> => {
  const current = getBudgets();
  const updated = { ...current, [category]: limit };
  localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updated));
  return updated;
};