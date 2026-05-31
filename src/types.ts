export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  walletBalance: number;
  role: UserRole;
  createdAt: string;
}

export type NetworkType = 'MTN' | 'AT' | 'Telecel';

export interface BundlePackage {
  id: string;
  network: NetworkType;
  name: string;
  dataSize: string; // e.g., "10 GB", "AFA Bundle", "500 MB"
  price: number; // in GH₵
  duration: string; // e.g., "30 Days", "No Expiry"
  description: string;
  isActive: boolean;
}

export type TransactionStatus = 'Pending' | 'Success' | 'Failed';
export type TransactionType = 'airtime' | 'data';

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  userPhone: string;
  date: string;
  network: NetworkType;
  serviceName: string;
  serviceType: TransactionType;
  amount: number;
  recipientPhone: string;
  status: TransactionStatus;
  referenceId: string;
  createdAt: string;
}

export type DepositStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Deposit {
  id: string;
  userId: string;
  userEmail: string;
  userPhone: string;
  amount: number;
  status: DepositStatus;
  paymentMethod: 'MTN MoMo' | 'Telecel Cash' | 'AT Money';
  transactionId: string; // User-provided MoMo transaction ID / TXN Ref
  referenceId: string; // Reality-Best system reference
  createdAt: string;
  approvedAt?: string;
}

export interface SalesStatistics {
  totalSales: number;
  totalTransactionsCount: number;
  totalDepositsCount: number;
  totalVolume: number;
  mtnSales: number;
  atSales: number;
  telecelSales: number;
}
