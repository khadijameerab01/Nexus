import React, { useState } from 'react';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  TrendingUp, Clock, CheckCircle, XCircle, ChevronRight,
  DollarSign, CreditCard, Building2, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { entrepreneurs, investors } from '../../data/users';
import toast from 'react-hot-toast';

type TxType = 'deposit' | 'withdraw' | 'transfer' | 'funding';
type TxStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  sender: string;
  receiver: string;
  status: TxStatus;
  date: string;
  note?: string;
}

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'deposit',  amount: 50000,  sender: 'Bank Account',      receiver: 'My Wallet',          status: 'completed', date: '2026-06-28', note: 'Initial deposit' },
  { id: 't2', type: 'funding',  amount: 25000,  sender: 'My Wallet',         receiver: 'TechWave AI',         status: 'completed', date: '2026-06-25', note: 'Seed round funding' },
  { id: 't3', type: 'transfer', amount: 5000,   sender: 'My Wallet',         receiver: 'Michael Rodriguez',   status: 'completed', date: '2026-06-20', note: 'Due diligence fee' },
  { id: 't4', type: 'withdraw', amount: 10000,  sender: 'My Wallet',         receiver: 'Bank Account',        status: 'pending',   date: '2026-06-18' },
  { id: 't5', type: 'deposit',  amount: 100000, sender: 'Bank Account',      receiver: 'My Wallet',          status: 'completed', date: '2026-06-10', note: 'Q2 allocation' },
  { id: 't6', type: 'funding',  amount: 15000,  sender: 'My Wallet',         receiver: 'GreenLife Solutions', status: 'failed',    date: '2026-06-05', note: 'Term sheet rejected' },
];

const TX_ICONS: Record<TxType, React.ReactNode> = {
  deposit:  <ArrowDownLeft  size={16} className="text-success-600" />,
  withdraw: <ArrowUpRight   size={16} className="text-warning-600" />,
  transfer: <ArrowLeftRight size={16} className="text-primary-600" />,
  funding:  <TrendingUp     size={16} className="text-accent-600"  />,
};

const TX_STATUS: Record<TxStatus, { label: string; variant: 'success' | 'warning' | 'error'; icon: React.ReactNode }> = {
  completed: { label: 'Completed', variant: 'success', icon: <CheckCircle size={12} /> },
  pending:   { label: 'Pending',   variant: 'warning', icon: <Clock       size={12} /> },
  failed:    { label: 'Failed',    variant: 'error',   icon: <XCircle     size={12} /> },
};

type ActiveModal = 'deposit' | 'withdraw' | 'transfer' | 'fund-deal' | null;

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(95000);
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [filterType, setFilterType] = useState<TxType | 'all'>('all');

  // Form state
  const [amount, setAmount] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const allUsers = user?.role === 'entrepreneur' ? investors : entrepreneurs;

  const filteredTx = transactions.filter(t => filterType === 'all' || t.type === filterType);

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const resetForm = () => { setAmount(''); setRecipientId(''); setNote(''); };

  const processTransaction = (type: TxType, label: string) => {
    const amt = parseFloat(amount.replace(/,/g, ''));
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (type !== 'deposit' && amt > balance) { toast.error('Insufficient balance'); return; }
    if ((type === 'transfer' || type === 'fund-deal') && !recipientId) { toast.error('Select a recipient'); return; }

    setIsProcessing(true);
    setTimeout(() => {
      const recipient = allUsers.find(u => u.id === recipientId);
      const newTx: Transaction = {
        id: `t${Date.now()}`,
        type: type === 'fund-deal' ? 'funding' : type,
        amount: amt,
        sender: type === 'deposit' ? 'Bank Account' : 'My Wallet',
        receiver: type === 'deposit' ? 'My Wallet' : type === 'withdraw' ? 'Bank Account' : recipient?.name ?? recipientId,
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
        note: note || undefined,
      };
      setTransactions(prev => [newTx, ...prev]);
      if (type === 'deposit') setBalance(prev => prev + amt);
      else setBalance(prev => prev - amt);
      setIsProcessing(false);
      setActiveModal(null);
      resetForm();
      toast.success(`${label} of ${formatAmount(amt)} successful!`);
    }, 1500);
  };

  const stats = [
    { label: 'Total Deposited', value: formatAmount(transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)), icon: <ArrowDownLeft size={20} />, color: 'text-success-600 bg-success-50' },
    { label: 'Total Withdrawn', value: formatAmount(transactions.filter(t => t.type === 'withdraw' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)), icon: <ArrowUpRight size={20} />, color: 'text-warning-600 bg-warning-50' },
    { label: 'Total Funded', value: formatAmount(transactions.filter(t => t.type === 'funding' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)), icon: <TrendingUp size={20} />, color: 'text-accent-600 bg-accent-50' },
    { label: 'Pending', value: formatAmount(transactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0)), icon: <Clock size={20} />, color: 'text-primary-600 bg-primary-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your wallet, transfers, and deal funding</p>
      </div>

      {/* Wallet card */}
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={18} className="opacity-80" />
              <span className="text-sm opacity-80">Wallet Balance</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-bold tracking-tight">
                {showBalance ? formatAmount(balance) : '••••••'}
              </h2>
              <button onClick={() => setShowBalance(p => !p)} className="opacity-70 hover:opacity-100 transition-opacity">
                {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-sm opacity-60 mt-1">{user?.name ?? 'My Account'}</p>
          </div>
          <div className="bg-white/10 rounded-full p-3">
            <CreditCard size={28} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          {[
            { label: 'Deposit',  icon: <ArrowDownLeft size={16} />,  modal: 'deposit'   as ActiveModal },
            { label: 'Withdraw', icon: <ArrowUpRight  size={16} />,  modal: 'withdraw'  as ActiveModal },
            { label: 'Transfer', icon: <ArrowLeftRight size={16} />, modal: 'transfer'  as ActiveModal },
            { label: 'Fund Deal', icon: <TrendingUp   size={16} />,  modal: 'fund-deal' as ActiveModal },
          ].map(({ label, icon, modal }) => (
            <button
              key={label}
              onClick={() => setActiveModal(modal)}
              className="flex-1 flex flex-col items-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-xl py-3 transition-colors"
            >
              <span className="bg-white/20 rounded-full p-1.5">{icon}</span>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardBody className="p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{s.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-semibold text-gray-900">Transaction History</h2>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'deposit', 'withdraw', 'transfer', 'funding'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                    filterType === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filteredTx.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <DollarSign size={36} className="mx-auto mb-2 opacity-30" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTx.map(tx => {
                const sc = TX_STATUS[tx.status];
                const isIncoming = tx.type === 'deposit';
                return (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'deposit' ? 'bg-success-50' :
                      tx.type === 'withdraw' ? 'bg-warning-50' :
                      tx.type === 'funding' ? 'bg-accent-50' : 'bg-primary-50'
                    }`}>
                      {TX_ICONS[tx.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 capitalize">{tx.type}</p>
                        <Badge variant={sc.variant} size="sm" rounded>
                          <span className="flex items-center gap-1">{sc.icon}{sc.label}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {tx.sender} → {tx.receiver}
                        {tx.note && <span className="ml-2 text-gray-300">· {tx.note}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${isIncoming ? 'text-success-600' : 'text-gray-900'}`}>
                        {isIncoming ? '+' : '-'}{formatAmount(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-400">{tx.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Modals ── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setActiveModal(null); resetForm(); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* Deposit */}
            {activeModal === 'deposit' && (
              <>
                <ModalHeader icon={<ArrowDownLeft size={20} className="text-success-600" />} title="Deposit Funds" onClose={() => { setActiveModal(null); resetForm(); }} />
                <div className="p-6 space-y-4">
                  <div className="flex gap-2">
                    {[5000, 10000, 25000, 50000].map(preset => (
                      <button key={preset} onClick={() => setAmount(String(preset))} className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${amount === String(preset) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}>
                        {formatAmount(preset)}
                      </button>
                    ))}
                  </div>
                  <Input label="Amount (USD)" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} startAdornment={<DollarSign size={16} />} fullWidth />
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                    <Building2 size={20} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Bank Account •••• 4242</p>
                      <p className="text-xs text-gray-400">Instant transfer</p>
                    </div>
                    <CheckCircle size={16} className="text-success-500 ml-auto" />
                  </div>
                  <Input label="Note (optional)" placeholder="e.g. Q3 allocation" value={note} onChange={e => setNote(e.target.value)} fullWidth />
                  <Button fullWidth isLoading={isProcessing} onClick={() => processTransaction('deposit', 'Deposit')} leftIcon={<ArrowDownLeft size={16} />}>
                    Deposit {amount ? formatAmount(parseFloat(amount) || 0) : 'Funds'}
                  </Button>
                </div>
              </>
            )}

            {/* Withdraw */}
            {activeModal === 'withdraw' && (
              <>
                <ModalHeader icon={<ArrowUpRight size={20} className="text-warning-600" />} title="Withdraw Funds" onClose={() => { setActiveModal(null); resetForm(); }} />
                <div className="p-6 space-y-4">
                  <div className="bg-primary-50 rounded-lg px-4 py-3 text-sm text-primary-700 font-medium">
                    Available: {formatAmount(balance)}
                  </div>
                  <Input label="Amount (USD)" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} startAdornment={<DollarSign size={16} />} fullWidth />
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                    <Building2 size={20} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Bank Account •••• 4242</p>
                      <p className="text-xs text-gray-400">1–3 business days</p>
                    </div>
                    <CheckCircle size={16} className="text-success-500 ml-auto" />
                  </div>
                  <Input label="Note (optional)" placeholder="Reason" value={note} onChange={e => setNote(e.target.value)} fullWidth />
                  <Button variant="warning" fullWidth isLoading={isProcessing} onClick={() => processTransaction('withdraw', 'Withdrawal')} leftIcon={<ArrowUpRight size={16} />}>
                    Withdraw {amount ? formatAmount(parseFloat(amount) || 0) : 'Funds'}
                  </Button>
                </div>
              </>
            )}

            {/* Transfer */}
            {activeModal === 'transfer' && (
              <>
                <ModalHeader icon={<ArrowLeftRight size={20} className="text-primary-600" />} title="Transfer Funds" onClose={() => { setActiveModal(null); resetForm(); }} />
                <div className="p-6 space-y-4">
                  <div className="bg-primary-50 rounded-lg px-4 py-3 text-sm text-primary-700 font-medium">
                    Available: {formatAmount(balance)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Send to</label>
                    <select className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-primary-500 focus:ring-primary-500" value={recipientId} onChange={e => setRecipientId(e.target.value)}>
                      <option value="">Select {user?.role === 'entrepreneur' ? 'investor' : 'entrepreneur'}...</option>
                      {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <Input label="Amount (USD)" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} startAdornment={<DollarSign size={16} />} fullWidth />
                  <Input label="Note (optional)" placeholder="e.g. Due diligence fee" value={note} onChange={e => setNote(e.target.value)} fullWidth />
                  <Button fullWidth isLoading={isProcessing} onClick={() => processTransaction('transfer', 'Transfer')} leftIcon={<ArrowLeftRight size={16} />}>
                    Send {amount ? formatAmount(parseFloat(amount) || 0) : 'Funds'}
                  </Button>
                </div>
              </>
            )}

            {/* Fund Deal */}
            {activeModal === 'fund-deal' && (
              <>
                <ModalHeader icon={<TrendingUp size={20} className="text-accent-600" />} title="Fund a Deal" onClose={() => { setActiveModal(null); resetForm(); }} />
                <div className="p-6 space-y-4">
                  <div className="bg-accent-50 border border-accent-100 rounded-lg p-3 text-sm text-accent-700">
                    <p className="font-medium mb-0.5">Investor → Entrepreneur Funding</p>
                    <p className="text-xs opacity-80">Funds are held in escrow until deal terms are confirmed by both parties.</p>
                  </div>
                  <div className="bg-primary-50 rounded-lg px-4 py-3 text-sm text-primary-700 font-medium">
                    Available: {formatAmount(balance)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fund startup</label>
                    <select className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-primary-500 focus:ring-primary-500" value={recipientId} onChange={e => setRecipientId(e.target.value)}>
                      <option value="">Select startup...</option>
                      {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <Input label="Investment Amount (USD)" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} startAdornment={<DollarSign size={16} />} fullWidth />
                  <Input label="Note / Deal Reference" placeholder="e.g. Series A - 15% equity" value={note} onChange={e => setNote(e.target.value)} fullWidth />
                  <Button variant="accent" fullWidth isLoading={isProcessing} onClick={() => processTransaction('fund-deal', 'Investment')} leftIcon={<TrendingUp size={16} />}>
                    Confirm Investment {amount ? `of ${formatAmount(parseFloat(amount) || 0)}` : ''}
                  </Button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

// Small reusable modal header
const ModalHeader: React.FC<{ icon: React.ReactNode; title: string; onClose: () => void }> = ({ icon, title, onClose }) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 transition-colors">
      <XCircle size={18} />
    </button>
  </div>
);
