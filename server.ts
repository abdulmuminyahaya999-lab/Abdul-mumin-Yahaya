import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { 
  User, 
  BundlePackage, 
  Transaction, 
  Deposit, 
  SalesStatistics 
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

/* ==================== WEBSOCKET REAL-TIME SERVICE ==================== */

const webSocketClients = new Map<string, WebSocket[]>();

function registerClient(userId: string, ws: WebSocket) {
  if (!webSocketClients.has(userId)) {
    webSocketClients.set(userId, []);
  }
  const clients = webSocketClients.get(userId)!;
  if (!clients.includes(ws)) {
    clients.push(ws);
    console.log(`[WS] Registered WebSocket client for user: ${userId}. Sockets active: ${clients.length}`);
  }
}

function removeClient(ws: WebSocket) {
  for (const [userId, clientList] of webSocketClients.entries()) {
    const index = clientList.indexOf(ws);
    if (index !== -1) {
      clientList.splice(index, 1);
      if (clientList.length === 0) {
        webSocketClients.delete(userId);
      }
      console.log(`[WS] Removed WebSocket client for user: ${userId}`);
      break;
    }
  }
}

function notifyPurchaseSuccess(userId: string, transaction: any) {
  const clientList = webSocketClients.get(userId);
  if (clientList) {
    const payload = JSON.stringify({
      type: 'purchase_success',
      data: {
        id: transaction.id,
        recipientPhone: transaction.recipientPhone,
        serviceName: transaction.serviceName,
        amount: transaction.amount,
        referenceId: transaction.referenceId,
        date: transaction.date,
        status: transaction.status,
      }
    });
    console.log(`[WS] Broadcasting success to user ${userId}: ${payload}`);
    clientList.forEach((wsClient) => {
      if (wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(payload);
      }
    });
  } else {
    console.log(`[WS] No active WS clients found for user ID: ${userId} to notify.`);
  }
}

function initWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    console.log('[WS] New incoming connection.');
    
    // Extract userId from URL if passed as query parameter
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const userIdQuery = url.searchParams.get('userId');
      if (userIdQuery) {
        registerClient(userIdQuery, ws);
      }
    } catch (err) {
      console.error('[WS] Error processing connection query string:', err);
    }

    ws.on('message', (message) => {
      try {
        const payload = JSON.parse(message.toString());
        if (payload.type === 'register' && payload.userId) {
          registerClient(payload.userId, ws);
        }
      } catch (err) {
        console.error('[WS] Error parsing client message:', err);
      }
    });

    ws.on('close', () => {
      removeClient(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] Client socket error:', err);
      removeClient(ws);
    });
  });
}


// Set up the local JSON database path
const DATABASE_DIR = path.join(process.cwd(), 'data');
const DATABASE_FILE = path.join(DATABASE_DIR, 'database.json');

// Initialize database check/creation
if (!fs.existsSync(DATABASE_DIR)) {
  fs.mkdirSync(DATABASE_DIR, { recursive: true });
}

// Initial bundle package seeds
const defaultPackages: BundlePackage[] = [
  {
    id: 'pkg-1',
    network: 'MTN',
    name: 'MTN Midnight Surf',
    dataSize: '5.5 GB',
    price: 12.00,
    duration: 'Midnight Only (12AM - 5AM)',
    description: 'High-speed internet for midnight surfers. Auto-activated.',
    isActive: true
  },
  {
    id: 'pkg-2',
    network: 'MTN',
    name: 'AFA registration Partner Bundle',
    dataSize: 'AFA Special (Unlimited Social + Calls + 5GB)',
    price: 30.00,
    duration: '30 Days',
    description: 'Register with AFA. Massive data and custom voice bundle.',
    isActive: true
  },
  {
    id: 'pkg-3',
    network: 'MTN',
    name: 'MTN Heavy Gamer Bundle',
    dataSize: '25 GB',
    price: 90.00,
    duration: '30 Days',
    description: 'MTN Non-expiry ultra bundle tailored for massive downloading & gaming.',
    isActive: true
  },
  {
    id: 'pkg-4',
    network: 'AT',
    name: 'AT iShare Personal',
    dataSize: '6.5 GB',
    price: 18.00,
    duration: '30 Days',
    description: 'Affordable AirtelTigo iShare internet sharing pack.',
    isActive: true
  },
  {
    id: 'pkg-5',
    network: 'AT',
    name: 'AT iShare Mega Pack',
    dataSize: '15 GB',
    price: 38.00,
    duration: '30 Days',
    description: 'Bulk internet bundle on AirtelTigo network for multiple devices.',
    isActive: true
  },
  {
    id: 'pkg-6',
    network: 'Telecel',
    name: 'Telecel Bossu Premium',
    dataSize: '12 GB + 100 Mins Voice',
    price: 45.00,
    duration: '30 Days',
    description: 'Telecel Bossu bundle. Instant voice allocations and robust data data.',
    isActive: true
  },
  {
    id: 'pkg-7',
    network: 'Telecel',
    name: 'Telecel Super Hour Rush',
    dataSize: '2 GB',
    price: 6.00,
    duration: '1 Hour',
    description: 'Ultra fast hourly booster for streaming and urgent tasks.',
    isActive: true
  }
];

// Seed initial database state if missing
const initDB = () => {
  if (!fs.existsSync(DATABASE_FILE)) {
    const initialData = {
      users: [
        {
          id: 'admin-1',
          email: 'admin@realitybest.com',
          fullName: 'Reality-Best Admin Manager',
          phone: '0241234567',
          walletBalance: 2500.00,
          role: 'admin',
          createdAt: new Date().toISOString(),
          password: 'admin' // Simple for MVP testing 
        },
        {
          id: 'user-0',
          email: 'abdulmuminyahaya999@gmail.com',
          fullName: 'Abdul Yahaya',
          phone: '0544317243',
          walletBalance: 150.00, // Pre-seeded with Cedis for testing
          role: 'user',
          createdAt: new Date().toISOString(),
          password: 'user123'
        },
        {
          id: 'user-1',
          email: 'demo@realitybest.com',
          fullName: 'Kwame Mensah',
          phone: '0544521401',
          walletBalance: 100.00, // Pre-seeded for testing 
          role: 'user',
          createdAt: new Date().toISOString(),
          password: 'demo'
        }
      ],
      packages: defaultPackages,
      transactions: [
        {
          id: 'tx-1',
          userId: 'user-1',
          userEmail: 'demo@realitybest.com',
          userPhone: '0544521401',
          date: new Date(Date.now() - 3600000 * 2).toISOString(),
          network: 'MTN',
          serviceName: 'AFA registration Partner Bundle',
          serviceType: 'data',
          amount: 30.00,
          recipientPhone: '0544521401',
          status: 'Success',
          referenceId: 'RB-0544521401-AFA30',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'tx-2',
          userId: 'user-1',
          userEmail: 'demo@realitybest.com',
          userPhone: '0544521401',
          date: new Date(Date.now() - 3600000 * 24).toISOString(),
          network: 'Telecel',
          serviceName: 'Telecel Super Hour Rush',
          serviceType: 'data',
          amount: 6.00,
          recipientPhone: '0209988771',
          status: 'Success',
          referenceId: 'RB-0209988771-SHR6',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
        }
      ],
      deposits: [
        {
          id: 'dep-1',
          userId: 'user-1',
          userEmail: 'demo@realitybest.com',
          userPhone: '0544521401',
          amount: 100.00,
          status: 'Approved',
          paymentMethod: 'MTN MoMo',
          transactionId: '15409848529',
          referenceId: 'RB-DEP-10023',
          createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
          approvedAt: new Date(Date.now() - 3600000 * 29).toISOString()
        },
        {
          id: 'dep-2',
          userId: 'user-1',
          userEmail: 'demo@realitybest.com',
          userPhone: '0544521401',
          amount: 50.00,
          status: 'Pending',
          paymentMethod: 'MTN MoMo',
          transactionId: '1549929841',
          referenceId: 'RB-DEP-14981',
          createdAt: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
};

initDB();

// Helper functions for reading/writing storage
const readDB = () => {
  try {
    const raw = fs.readFileSync(DATABASE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file, resetting', err);
    initDB();
    return JSON.parse(fs.readFileSync(DATABASE_FILE, 'utf8'));
  }
};

const writeDB = (data: any) => {
  fs.writeFileSync(DATABASE_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Simulated Token/Header Auth Middleware
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Exchanged via Bearer schema.' });
  }
  const userId = authHeader.split(' ')[1];
  const db = readDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid user transaction token.' });
  }
  
  // Attach user identity to request object
  (req as any).user = user;
  next();
};

// Admin authentication middleware
const adminMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  authMiddleware(req, res, () => {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
    }
    next();
  });
};

/* ==================== AUTHENTICATION API ROUTES ==================== */

// REGISTER
app.post('/api/auth/register', (req, res) => {
  const { email, password, fullName, phone } = req.body;
  if (!email || !password || !fullName || !phone) {
    return res.status(400).json({ error: 'All fields (email, password, fullName, phone) are required.' });
  }

  const db = readDB();
  
  // Exclude duplicate emails
  const existingEmail = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existingEmail) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  const newUser: any = {
    id: 'user-' + Date.now(),
    email: email.toLowerCase(),
    password, // Plain string for development ease-of-use (MVP sandbox style)
    fullName,
    phone,
    walletBalance: 0.00,
    role: 'user',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDB(db);

  // Sanitized profile for client
  const { password: _, ...sanitizedUser } = newUser;
  res.status(201).json({ user: sanitizedUser, token: newUser.id });
});

// LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const { password: _, ...sanitizedUser } = user;
  res.json({ user: sanitizedUser, token: user.id });
});

// GET CURRENT USER
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { password: _, ...sanitizedUser } = user;
  res.json(sanitizedUser);
});


/* ==================== CORE USER SERVICES API ROUTES ==================== */

// GET WALLET BALANCE & PROFILE STATE
app.get('/api/user/wallet', authMiddleware, (req, res) => {
  const user = (req as any).user;
  res.json({ walletBalance: user.walletBalance });
});

// REQUEST MOBILE MONEY FUNDING DEPOSIT
app.post('/api/user/deposit', authMiddleware, (req, res) => {
  const { amount, paymentMethod, transactionId } = req.body;
  if (!amount || amount <= 0 || !paymentMethod || !transactionId) {
    return res.status(400).json({ error: 'Invalid parameters. Please provide valid amount, method, and Ref/Txn ID.' });
  }

  const user = (req as any).user;
  const db = readDB();

  const newDeposit: Deposit = {
    id: 'dep-' + Date.now(),
    userId: user.id,
    userEmail: user.email,
    userPhone: user.phone,
    amount: Number(amount),
    status: 'Pending',
    paymentMethod,
    transactionId,
    referenceId: 'RB-DEP-' + Math.floor(10000 + Math.random() * 90000),
    createdAt: new Date().toISOString()
  };

  db.deposits.push(newDeposit);
  writeDB(db);

  res.status(201).json({ message: 'Mobile Money deposit logged. Waiting for Admin approval.', deposit: newDeposit });
});

// MAKE AIRTIME / DATA PURCHASE
app.post('/api/user/purchase', authMiddleware, (req, res) => {
  const { network, serviceType, serviceName, amount, recipientPhone, packageId } = req.body;
  
  if (!network || !serviceType || !amount || !recipientPhone) {
    return res.status(400).json({ error: 'Missing parameters. Network, serviceType, amount, and recipientPhone required.' });
  }

  const user = (req as any).user;
  const db = readDB();

  // Freshly confirm user wallet balance
  const dbUser = db.users.find((u: any) => u.id === user.id);
  if (!dbUser) {
    return res.status(404).json({ error: 'User mapping not found.' });
  }

  if (dbUser.walletBalance < amount) {
    return res.status(400).json({ error: `Insufficient wallet balance. Total required is GH₵ ${Number(amount).toFixed(2)}, but you have GH₵ ${dbUser.walletBalance.toFixed(2)}.` });
  }

  // Deduct Cedis
  dbUser.walletBalance = Number((dbUser.walletBalance - amount).toFixed(2));

  // Build Transaction Record
  const cleanServiceName = serviceName || (serviceType === 'airtime' ? `${network} Instant Airtime` : 'Standard Bundle');
  const referenceId = 'RB-' + recipientPhone + '-' + (serviceType === 'airtime' ? 'ART' : 'DB') + Math.floor(100 + Math.random() * 900);

  const newTransaction: Transaction = {
    id: 'tx-' + Date.now(),
    userId: dbUser.id,
    userEmail: dbUser.email,
    userPhone: dbUser.phone,
    date: new Date().toISOString(),
    network,
    serviceName: cleanServiceName,
    serviceType,
    amount: Number(amount),
    recipientPhone,
    status: 'Success', // By default, automated reselling is near-instant success
    referenceId,
    createdAt: new Date().toISOString()
  };

  db.transactions.push(newTransaction);
  writeDB(db);

  // Trigger real-time notification broadcast
  try {
    notifyPurchaseSuccess(dbUser.id, newTransaction);
  } catch (err) {
    console.error('Error sending real-time notification on purchase:', err);
  }

  res.status(200).json({ 
    message: 'Purchase successful! Airtime/Bundle has been queued for immediate delivery.',
    transaction: newTransaction,
    newBalance: dbUser.walletBalance
  });
});

// READ USER TRANSACTIONS LIST
app.get('/api/user/transactions', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const db = readDB();
  const userTxs = db.transactions.filter((tx: any) => tx.userId === user.id);
  // Sort descending by date
  userTxs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(userTxs);
});

// READ USER DEPOSITS LIST
app.get('/api/user/deposits', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const db = readDB();
  const userDeposits = db.deposits.filter((dep: any) => dep.userId === user.id);
  userDeposits.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userDeposits);
});

// TRACK TRANSACTION / CHECK REF BY REFERENCE ID (Global/Public access allowed)
app.get('/api/orders/track/:referenceId', (req, res) => {
  const { referenceId } = req.params;
  const db = readDB();

  // Search inside transactional records
  const matchedTx = db.transactions.find((tx: any) => tx.referenceId.trim().toLowerCase() === referenceId.trim().toLowerCase());
  if (matchedTx) {
    return res.json({ found: true, type: 'transaction', data: matchedTx });
  }

  // Search inside wallet funding deposits
  const matchedDeposit = db.deposits.find((dep: any) => dep.referenceId.trim().toLowerCase() === referenceId.trim().toLowerCase() || dep.transactionId.trim() === referenceId.trim());
  if (matchedDeposit) {
    return res.json({ found: true, type: 'deposit', data: matchedDeposit });
  }

  res.status(404).json({ found: false, error: 'Reference code is not associated with any recorded transaction.' });
});


/* ==================== ADMIN DASHBOARD CONTROL ROUTES ==================== */

// RETRIEVE ALL SYSTEM USERS
app.get('/api/admin/users', adminMiddleware, (req, res) => {
  const db = readDB();
  // Safe mapping, omitting passwords
  const sanitizedUsers = db.users.map(({ password, ...u }: any) => u);
  res.json(sanitizedUsers);
});

// MANUAL ADJUST USER BALANCE
app.post('/api/admin/users/:userId/balance', adminMiddleware, (req, res) => {
  const { userId } = req.params;
  const { changeAmount } = req.body; // absolute number to set, or delta

  if (changeAmount === undefined || isNaN(changeAmount)) {
    return res.status(400).json({ error: 'Must provide numeric changeAmount' });
  }

  const db = readDB();
  const index = db.users.findIndex((u: any) => u.id === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'User does not exist.' });
  }

  db.users[index].walletBalance = Number(Number(changeAmount).toFixed(2));
  writeDB(db);

  res.json({ message: 'User updated successfully.', user: db.users[index] });
});

// RETRIEVE ALL SYSTEM MO-MO DEPOSITS (Pending/Approved)
app.get('/api/admin/deposits', adminMiddleware, (req, res) => {
  const db = readDB();
  const allDeps = [...db.deposits];
  allDeps.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(allDeps);
});

// APPROVE OR REJECT A DEPOSIT TRANSACTION SLIP
app.post('/api/admin/deposits/:depositId/action', adminMiddleware, (req, res) => {
  const { depositId } = req.params;
  const { action } = req.body; // 'Approve' | 'Reject'

  if (action !== 'Approved' && action !== 'Rejected') {
    return res.status(400).json({ error: 'Validation failed. Action must be Approved or Rejected.' });
  }

  const db = readDB();
  const depositIndex = db.deposits.findIndex((d: any) => d.id === depositId);
  
  if (depositIndex === -1) {
    return res.status(404).json({ error: 'Deposit request matching this ID was not found.' });
  }

  const deposit = db.deposits[depositIndex];
  if (deposit.status !== 'Pending') {
    return res.status(400).json({ error: `Completed Action. Deposit status is already ${deposit.status}.` });
  }

  deposit.status = action;
  deposit.approvedAt = new Date().toISOString();

  // If approved, trigger balance increment
  if (action === 'Approved') {
    const userIndex = db.users.findIndex((u: any) => u.id === deposit.userId);
    if (userIndex !== -1) {
      db.users[userIndex].walletBalance = Number((db.users[userIndex].walletBalance + deposit.amount).toFixed(2));
    }
  }

  writeDB(db);
  res.json({ message: `Successfully updated deposit status to: ${deposit.status}`, deposit });
});

// RETRIEVE ALL ORDER/SALES TRANSACTIONS
app.get('/api/admin/transactions', adminMiddleware, (req, res) => {
  const db = readDB();
  const allTxs = [...db.transactions];
  allTxs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(allTxs);
});

// UPDATE STATE OF AN ORDER TRANSACTION (Success/Fail/Refund)
app.post('/api/admin/transactions/:txId/status', adminMiddleware, (req, res) => {
  const { txId } = req.params;
  const { status } = req.body; // 'Success' | 'Failed'

  if (status !== 'Success' && status !== 'Failed') {
    return res.status(400).json({ error: 'Status must be Success or Failed.' });
  }

  const db = readDB();
  const txIndex = db.transactions.findIndex((t: any) => t.id === txId);
  
  if (txIndex === -1) {
    return res.status(404).json({ error: 'Transaction ID not found.' });
  }

  const transaction = db.transactions[txIndex];
  const oldStatus = transaction.status;

  if (oldStatus === status) {
    return res.json({ message: 'No status change required.', transaction });
  }

  transaction.status = status;

  // AUTO REFUND MECHANISM: If transaction transitions to Failed from Success, refund Cedis backend
  if (oldStatus === 'Success' && status === 'Failed') {
    const userIndex = db.users.findIndex((u: any) => u.id === transaction.userId);
    if (userIndex !== -1) {
      db.users[userIndex].walletBalance = Number((db.users[userIndex].walletBalance + transaction.amount).toFixed(2));
    }
  } 
  // If and only if transitioning from Failed to Success, re-check balance and deduct
  else if (oldStatus === 'Failed' && status === 'Success') {
    const userIndex = db.users.findIndex((u: any) => u.id === transaction.userId);
    if (userIndex !== -1) {
      db.users[userIndex].walletBalance = Number((db.users[userIndex].walletBalance - transaction.amount).toFixed(2));
    }
  }

  writeDB(db);

  if (status === 'Success' && oldStatus !== 'Success') {
    try {
      notifyPurchaseSuccess(transaction.userId, transaction);
    } catch (err) {
      console.error('Error sending real-time notification on admin status update:', err);
    }
  }

  res.json({ message: `Transaction status updated to ${status}. Wallet balance adjusted if needed.`, transaction });
});

// ADMIN DATA PACKAGES MANAGEMENT LISTS
app.get('/api/admin/packages', (req, res) => {
  const db = readDB();
  res.json(db.packages);
});

// CREATE CUSTOM DATA BUNDLE PACKAGE OR REGISTRATION SCHEMAS
app.post('/api/admin/packages', adminMiddleware, (req, res) => {
  const { network, name, dataSize, price, duration, description } = req.body;

  if (!network || !name || !dataSize || isNaN(price) || !duration) {
    return res.status(400).json({ error: 'Missing package parameter details.' });
  }

  const db = readDB();
  const newPackage: BundlePackage = {
    id: 'pkg-' + Date.now(),
    network,
    name,
    dataSize,
    price: Number(price),
    duration,
    description: description || '',
    isActive: true
  };

  db.packages.push(newPackage);
  writeDB(db);

  res.status(201).json({ message: 'Package successfully added.', package: newPackage });
});

// UPDATE MOBILE BUNDLE PACKAGE COSTS OR ATTRIBUTES
app.put('/api/admin/packages/:packageId', adminMiddleware, (req, res) => {
  const { packageId } = req.params;
  const { network, name, dataSize, price, duration, description, isActive } = req.body;

  const db = readDB();
  const index = db.packages.findIndex((p: any) => p.id === packageId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Telecom package could not be found.' });
  }

  const pkg = db.packages[index];
  if (network) pkg.network = network;
  if (name) pkg.name = name;
  if (dataSize) pkg.dataSize = dataSize;
  if (price !== undefined) pkg.price = Number(price);
  if (duration) pkg.duration = duration;
  if (description !== undefined) pkg.description = description;
  if (isActive !== undefined) pkg.isActive = Boolean(isActive);

  writeDB(db);
  res.json({ message: 'Package updated.', package: pkg });
});

// REMOVE MOBILITY DATA BUNDLE PLAN
app.delete('/api/admin/packages/:packageId', adminMiddleware, (req, res) => {
  const { packageId } = req.params;
  const db = readDB();
  const existIdx = db.packages.findIndex((p: any) => p.id === packageId);
  
  if (existIdx === -1) {
    return res.status(404).json({ error: 'Target package does not exist.' });
  }

  db.packages.splice(existIdx, 1);
  writeDB(db);
  res.json({ message: 'Package deleted successfully.' });
});

// AGGREGATE CORE SALES SALES REPORTING STATISTICS
app.get('/api/admin/statistics', adminMiddleware, (req, res) => {
  const db = readDB();
  const txs = db.transactions;
  const deps = db.deposits;

  const totalSales = txs
    .filter((tx: any) => tx.status === 'Success')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const mtnSales = txs
    .filter((tx: any) => tx.status === 'Success' && tx.network === 'MTN')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const atSales = txs
    .filter((tx: any) => tx.status === 'Success' && tx.network === 'AT')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const telecelSales = txs
    .filter((tx: any) => tx.status === 'Success' && tx.network === 'Telecel')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const completedDeposits = deps.filter((d: any) => d.status === 'Approved');
  const depositVolume = completedDeposits.reduce((sum: number, d: any) => sum + d.amount, 0);

  const stats: SalesStatistics = {
    totalSales: Number(totalSales.toFixed(2)),
    totalTransactionsCount: txs.length,
    totalDepositsCount: deps.length,
    totalVolume: Number(depositVolume.toFixed(2)),
    mtnSales: Number(mtnSales.toFixed(2)),
    atSales: Number(atSales.toFixed(2)),
    telecelSales: Number(telecelSales.toFixed(2))
  };

  res.json(stats);
});

/* ==================== VITE CLIENT INTEGRATION MIDDLEWARES ==================== */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve HTML
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[REALITY-BEST SERVER] full-stack live at http://localhost:${PORT}`);
  });

  // Start the WebSocket server using the active HTTP server
  try {
    initWebSocketServer(server);
    console.log('[WS] WebSocket Server successfully initialized alongside HTTP Server.');
  } catch (err) {
    console.error('[WS] Failed to initialize WebSocket Server:', err);
  }
}

startServer();
