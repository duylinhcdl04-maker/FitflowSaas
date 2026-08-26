import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Gear, Globe, Trash, Pencil, Check, LockKey, MagnifyingGlass, Spinner, CheckCircle, QrCode } from '@phosphor-icons/react';
import {
  getTenantBrand,
  updateTenantBrand,
  listPaymentAccounts,
  createPaymentAccount,
  updatePaymentAccount,
  deletePaymentAccount,
  listBanks,
  lookupAccountName,
} from '../api/settings';
import type { PaymentAccount, VietQrBank } from '../api/settings';
import { getCheckinConfig, updateCheckinConfig } from '../api/onboarding';
import { listBranches } from '../api/branches';
import { fetchMe, requestChangePasswordOtp, changePasswordWithOtp } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';
import Callout from '../components/Callout';
import FormField, { inputClass } from '../components/FormField';
import PasswordInput from '../components/PasswordInput';
import { Skeleton } from '../components/Skeleton';
import Modal from '../components/Modal';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'brand' | 'payment' | 'checkin' | 'security'>('brand');
  const queryClient = useQueryClient();

  // Queries
  const { data: brand, isLoading: isBrandLoading } = useQuery({
    queryKey: ['owner-tenant-brand'],
    queryFn: getTenantBrand,
  });

  const { data: accounts, isLoading: isAccountsLoading } = useQuery({
    queryKey: ['owner-payment-accounts'],
    queryFn: listPaymentAccounts,
  });

  const { data: checkinConfig, isLoading: isCheckinLoading } = useQuery({
    queryKey: ['owner-checkin-config'],
    queryFn: getCheckinConfig,
  });

  const { data: branches } = useQuery({
    queryKey: ['owner-branches-list'],
    queryFn: listBranches,
  });

  // Tab Header CSS helper
  const tabClass = (tab: typeof activeTab) =>
    `flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
      activeTab === tab
        ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
        : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200'
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Cài đặt hệ thống</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Cấu hình thông tin thương hiệu, tài khoản thanh toán và các tính năng vận hành</p>
      </div>

      <div className="border-b border-stone-200 dark:border-zinc-800 flex gap-2">
        <button type="button" onClick={() => setActiveTab('brand')} className={tabClass('brand')}>
          <Globe size={18} /> Thương hiệu
        </button>
        <button type="button" onClick={() => setActiveTab('payment')} className={tabClass('payment')}>
          <CreditCard size={18} /> Tài khoản thanh toán
        </button>
        <button type="button" onClick={() => setActiveTab('checkin')} className={tabClass('checkin')}>
          <Gear size={18} /> Cấu hình Check-in
        </button>
        <button type="button" onClick={() => setActiveTab('security')} className={tabClass('security')}>
          <LockKey size={18} /> Bảo mật & Mật khẩu
        </button>
      </div>

      <div className="mt-2">
        {activeTab === 'brand' && (
          <BrandTab brand={brand} isLoading={isBrandLoading} queryClient={queryClient} />
        )}
        {activeTab === 'payment' && (
          <PaymentTab accounts={accounts} isLoading={isAccountsLoading} branches={branches} queryClient={queryClient} />
        )}
        {activeTab === 'checkin' && (
          <CheckinTab config={checkinConfig} isLoading={isCheckinLoading} queryClient={queryClient} />
        )}
        {activeTab === 'security' && (
          <SecurityTab />
        )}
      </div>
    </div>
  );
}

// ---------------- TAB 1: THƯƠNG HIỆU ----------------
function BrandTab({ brand, isLoading, queryClient }: { brand: any; isLoading: boolean; queryClient: any }) {
  const [form, setForm] = useState({ name: '', logoUrl: '', contactEmail: '', contactPhone: '', address: '' });
  const [isInitialized, setIsInitialized] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (brand && !isInitialized) {
    setForm({
      name: brand.name || '',
      logoUrl: brand.logoUrl || '',
      contactEmail: brand.contactEmail || '',
      contactPhone: brand.contactPhone || '',
      address: brand.address || '',
    });
    setIsInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: () => updateTenantBrand({
      name: form.name,
      logo_url: form.logoUrl || undefined,
      contact_email: form.contactEmail || undefined,
      contact_phone: form.contactPhone || undefined,
      address: form.address || undefined,
    }),
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['owner-tenant-brand'] });
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể cập nhật cấu hình thương hiệu')),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    mutation.mutate();
  }

  return (
    <Card className="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">Thông tin phòng tập / doanh nghiệp</h2>
        
        <FormField label="Tên thương hiệu / Phòng tập *" htmlFor="brand-name">
          <input
            id="brand-name"
            required
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </FormField>

        <FormField label="Địa chỉ URL Logo" htmlFor="brand-logo">
          <input
            id="brand-logo"
            className={inputClass}
            placeholder="https://example.com/logo.png"
            value={form.logoUrl}
            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Email liên hệ" htmlFor="brand-email">
            <input
              id="brand-email"
              type="email"
              className={inputClass}
              value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
            />
          </FormField>

          <FormField label="Số điện thoại" htmlFor="brand-phone">
            <input
              id="brand-phone"
              type="tel"
              className={inputClass}
              value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
            />
          </FormField>
        </div>

        <FormField label="Địa chỉ trụ sở / cơ sở chính" htmlFor="brand-address">
          <textarea
            id="brand-address"
            rows={2}
            className={inputClass}
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </FormField>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">Đã cập nhật cấu hình thương hiệu thành công!</p>}

        <div className="mt-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ---------------- TAB 2: TÀI KHOẢN THANH TOÁN ----------------
/** Same VietQR image API used server-side (backend/src/common/utils/vietqr.ts) — pure client-side preview, no backend call. */
function buildPreviewQrUrl(bank: VietQrBank, accountNumber: string, accountHolder: string) {
  const params = new URLSearchParams({ acc: accountNumber, bank: bank.shortName || bank.code, template: 'compact' });
  if (accountHolder.trim()) params.set('holder', accountHolder.trim());
  return `https://vietqr.app/img?${params.toString()}`;
}

/** Searchable dropdown over VietQR's ~65 NAPAS-member banks — replaces free-text bank code/name entry. */
function BankCombobox({ banks, value, onChange, id }: { banks: VietQrBank[]; value: VietQrBank | null; onChange: (bank: VietQrBank) => void; id: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? banks.filter((b) => `${b.shortName} ${b.name} ${b.code}`.toLowerCase().includes(query.trim().toLowerCase()))
    : banks;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        className={`${inputClass} flex items-center justify-between gap-2 text-left`}
      >
        {value ? (
          <span className="flex items-center gap-2 min-w-0">
            {value.logo && <img src={value.logo} alt="" className="h-5 w-5 shrink-0 rounded object-contain" />}
            <span className="truncate">{value.shortName} <span className="text-zinc-400 font-mono text-xs">({value.code})</span></span>
          </span>
        ) : (
          <span className="text-zinc-400">-- Chọn ngân hàng --</span>
        )}
        <MagnifyingGlass size={14} className="shrink-0 text-zinc-400" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-stone-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="p-2 border-b border-stone-100 dark:border-zinc-800">
            <input
              autoFocus
              placeholder="Tìm ngân hàng..."
              className={`${inputClass} py-2 text-xs`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-zinc-400 text-center">Không tìm thấy ngân hàng.</div>
            ) : (
              filtered.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    onChange(b);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-stone-50 dark:hover:bg-zinc-800"
                >
                  {b.logo && <img src={b.logo} alt="" className="h-5 w-5 shrink-0 rounded object-contain" />}
                  <span className="truncate">{b.shortName}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-zinc-400">{b.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentTab({ accounts, isLoading, branches, queryClient }: { accounts: PaymentAccount[] | undefined; isLoading: boolean; branches: any[] | undefined; queryClient: any }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [form, setForm] = useState({ bankCode: '', bankName: '', accountNumber: '', accountName: '', branchId: '', isDefault: false, sepayApiKey: '' });
  const [selectedBank, setSelectedBank] = useState<VietQrBank | null>(null);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: banks = [] } = useQuery({
    queryKey: ['vietqr-banks'],
    queryFn: listBanks,
    staleTime: 24 * 60 * 60 * 1000,
  });

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  // Auto-lookup the real account holder name ~600ms after the Owner stops typing a
  // valid-looking account number, once a bank is selected. Never overrides a name the
  // Owner has already typed themselves unless the lookup succeeds.
  useEffect(() => {
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (!selectedBank || form.accountNumber.trim().length < 6) {
      setLookupStatus('idle');
      setLookupMessage(null);
      return;
    }
    setLookupStatus('loading');
    setLookupMessage(null);
    lookupTimer.current = setTimeout(async () => {
      try {
        const { accountName } = await lookupAccountName(selectedBank.bin, form.accountNumber.trim());
        setForm((f) => ({ ...f, accountName }));
        setLookupStatus('success');
        setLookupMessage(`Đã xác minh: ${accountName}`);
      } catch (err) {
        setLookupStatus('error');
        setLookupMessage(apiErrorMessage(err, 'Không tra được tên chủ tài khoản — vui lòng nhập tay.'));
      }
    }, 600);
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBank?.bin, form.accountNumber]);

  const createMutation = useMutation({
    mutationFn: (input: any) => createPaymentAccount(input),
    onSuccess: () => {
      setModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['owner-payment-accounts'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể thêm tài khoản thanh toán')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => updatePaymentAccount(id, input),
    onSuccess: () => {
      setModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['owner-payment-accounts'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể cập nhật tài khoản thanh toán')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePaymentAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-payment-accounts'] });
    },
  });

  function resetForm() {
    setForm({ bankCode: '', bankName: '', accountNumber: '', accountName: '', branchId: '', isDefault: false, sepayApiKey: '' });
    setSelectedBank(null);
    setLookupStatus('idle');
    setLookupMessage(null);
    setEditingAccount(null);
    setError(null);
  }

  function handleOpenCreate() {
    resetForm();
    setModalOpen(true);
  }

  function handleOpenEdit(acc: PaymentAccount) {
    setEditingAccount(acc);
    setForm({
      bankCode: acc.bank_code,
      bankName: acc.bank_name,
      accountNumber: acc.account_number,
      accountName: acc.account_name,
      branchId: acc.branch_id || '',
      isDefault: acc.is_default,
      sepayApiKey: '', // never prefilled — raw key is not returned by the API
    });
    // Match the stored bank_code back to a real bank so the QR preview + lookup keep working on edit.
    setSelectedBank(banks.find((b) => b.code === acc.bank_code) || null);
    setLookupStatus('idle');
    setLookupMessage(null);
    setModalOpen(true);
  }

  function handleSelectBank(bank: VietQrBank) {
    setSelectedBank(bank);
    setForm((f) => ({ ...f, bankCode: bank.code, bankName: bank.shortName }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: Record<string, unknown> = {
      bankCode: form.bankCode,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      accountName: form.accountName.toUpperCase(),
      branchId: form.branchId || undefined,
      isDefault: form.isDefault,
    };
    // Leave the key untouched on edit unless the Owner actually typed a new one.
    if (form.sepayApiKey.trim()) {
      input.sepayApiKey = form.sepayApiKey.trim();
    }

    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, input });
    } else {
      createMutation.mutate(input);
    }
  }

  function handleSetDefault(acc: PaymentAccount) {
    updateMutation.mutate({
      id: acc.id,
      input: { isDefault: true },
    });
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">Tài khoản thanh toán nhận tiền (mã QR)</h2>
        <Button size="sm" onClick={handleOpenCreate}>+ Thêm tài khoản</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {accounts && accounts.length > 0 ? (
          accounts.map((acc) => (
            <Card key={acc.id} className="relative flex flex-col justify-between border border-stone-200/80 dark:border-zinc-800">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {acc.bank_code}
                    </span>
                    <h3 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50 mt-1">{acc.bank_name}</h3>
                  </div>
                  {acc.is_default ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center gap-1">
                      <Check size={12} /> Mặc định
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(acc)}
                      className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline"
                    >
                      Đặt làm mặc định
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <p className="text-sm font-mono font-semibold text-zinc-800 dark:text-zinc-200">{acc.account_number}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{acc.account_name}</p>
                </div>

                <div className="mt-3 text-xs text-zinc-400">
                  Phạm vi: {acc.branch_id ? branches?.find(b => b.id === acc.branch_id)?.name || 'Chi nhánh cụ thể' : 'Tất cả chi nhánh'}
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 dark:border-zinc-800 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">SePay API Key</span>
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">{acc.sepayApiKeyMasked || 'Chưa cấu hình'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">Webhook URL</span>
                    <input
                      readOnly
                      value={acc.webhookUrl}
                      className="min-w-0 flex-1 truncate rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[11px] font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(acc.webhookUrl, acc.id)}
                      className="shrink-0 text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 underline"
                    >
                      {copiedId === acc.id ? 'Đã chép' : 'Chép'}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">Dán URL này vào SePay Dashboard → Cấu hình Webhook → xác thực kiểu "API Key".</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800 flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(acc)}
                  className="p-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  title="Chỉnh sửa"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Bạn có chắc chắn muốn xoá tài khoản thanh toán này?')) {
                      deleteMutation.mutate(acc.id);
                    }
                  }}
                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  title="Xoá"
                >
                  <Trash size={16} />
                </button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-sm text-zinc-400">Chưa cấu hình tài khoản thanh toán nào. Qúy khách cần tạo ít nhất một tài khoản mặc định để khách hàng thực hiện thanh toán qua QR.</div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingAccount ? 'Cập nhật tài khoản thanh toán' : 'Thêm tài khoản thanh toán'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Ngân hàng *" htmlFor="acc-bank">
            <BankCombobox id="acc-bank" banks={banks} value={selectedBank} onChange={handleSelectBank} />
          </FormField>

          <FormField label="Số tài khoản *" htmlFor="acc-number">
            <input
              id="acc-number"
              required
              placeholder="0123456789"
              className={inputClass}
              value={form.accountNumber}
              onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
            />
          </FormField>

          <FormField
            label="Tên chủ tài khoản (không dấu) *"
            htmlFor="acc-name"
            hint={
              lookupStatus === 'loading'
                ? undefined
                : lookupStatus === 'error'
                  ? lookupMessage || undefined
                  : !selectedBank
                    ? 'Chọn ngân hàng ở trên để hệ thống tự tra tên chủ tài khoản.'
                    : undefined
            }
          >
            <div className="relative">
              <input
                id="acc-name"
                required
                placeholder="NGUYEN VAN A"
                className={`${inputClass} uppercase ${lookupStatus === 'loading' ? 'pr-10' : lookupStatus === 'success' ? 'pr-10' : ''}`}
                value={form.accountName}
                onChange={(e) => {
                  setForm((f) => ({ ...f, accountName: e.target.value }));
                  setLookupStatus('idle');
                  setLookupMessage(null);
                }}
              />
              {lookupStatus === 'loading' && (
                <Spinner size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" />
              )}
              {lookupStatus === 'success' && (
                <CheckCircle size={16} weight="fill" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
              )}
            </div>
            {lookupStatus === 'success' && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Đã xác minh với VietQR: khớp chủ tài khoản thật.</p>
            )}
          </FormField>

          {selectedBank && form.accountNumber.trim().length >= 6 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                <QrCode size={14} /> Xem trước mã QR khách sẽ quét
              </p>
              <img
                src={buildPreviewQrUrl(selectedBank, form.accountNumber.trim(), form.accountName)}
                alt="Xem trước VietQR"
                className="h-40 w-40 rounded-lg border bg-white p-1 shadow-sm"
              />
            </div>
          )}

          <FormField label="Áp dụng tại chi nhánh" htmlFor="acc-branch">
            <select
              id="acc-branch"
              className={inputClass}
              value={form.branchId}
              onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
            >
              <option value="">Tất cả chi nhánh</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </FormField>

          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="h-4 w-4 accent-emerald-600"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Đặt làm tài khoản nhận thanh toán mặc định</span>
          </label>

          <FormField
            label="SePay API Key (Webhook)"
            htmlFor="acc-sepay-key"
            hint={
              editingAccount
                ? `Hiện tại: ${editingAccount.sepayApiKeyMasked || 'chưa cấu hình'}. Để trống nếu không muốn đổi.`
                : 'Lấy trong SePay Dashboard → Công ty → Cấu hình Webhook. Dùng để hệ thống tự xác nhận thanh toán khi tiền về.'
            }
          >
            <PasswordInput
              id="acc-sepay-key"
              value={form.sepayApiKey}
              onChange={(v) => setForm((f) => ({ ...f, sepayApiKey: v }))}
              autoComplete="off"
            />
          </FormField>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Huỷ</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Lưu</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ---------------- TAB 3: CẤU HÌNH CHECK-IN ----------------
function CheckinTab({ config, isLoading, queryClient }: { config: any; isLoading: boolean; queryClient: any }) {
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (next: { qr: boolean; manual: boolean; face: boolean }) => updateCheckinConfig(next),
    onSuccess: (data) => {
      queryClient.setQueryData(['owner-checkin-config'], data);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể cập nhật cấu hình check-in')),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!config) return null;

  function toggle(key: 'qr' | 'face') {
    setError(null);
    mutation.mutate({ ...config!, [key]: !config![key] });
  }

  return (
    <Card className="max-w-2xl">
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">Phương thức Check-in áp dụng cho hệ thống</h2>
        <Callout tone="info">Check-in thủ công (lễ tân thao tác tại quầy) luôn được bật mặc định ở mọi gói.</Callout>
        
        <div className="flex flex-col gap-3 mt-2">
          <label className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 dark:border-zinc-800 hover:bg-stone-50/50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer">
            <div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 block">Check-in bằng QR</span>
              <span className="text-xs text-zinc-400">Cho phép hội viên quét mã QR trên ứng dụng di động để check-in tại quầy</span>
            </div>
            <input type="checkbox" checked={config.qr} onChange={() => toggle('qr')} className="h-5 w-5 accent-emerald-600 cursor-pointer" />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 dark:border-zinc-800 hover:bg-stone-50/50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer">
            <div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 block">Nhận diện khuôn mặt</span>
              <span className="text-xs text-zinc-400">Sử dụng Camera nhận dạng sinh trắc học để tự động mở cổng check-in</span>
            </div>
            <input type="checkbox" checked={config.face} onChange={() => toggle('face')} className="h-5 w-5 accent-emerald-600 cursor-pointer" />
          </label>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
      </div>
    </Card>
  );
}

// ---------------- TAB 4: BẢO MẬT & MẬT KHẨU ----------------
function SecurityTab() {
  const { data: me } = useQuery({
    queryKey: ['owner-me'],
    queryFn: fetchMe,
  });

  const [otpSent, setOtpSent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const requestOtpMutation = useMutation({
    mutationFn: requestChangePasswordOtp,
    onSuccess: () => {
      setOtpSent(true);
      setError(null);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể gửi mã OTP đổi mật khẩu')),
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => changePasswordWithOtp(code, newPassword, currentPassword || undefined),
    onSuccess: (data) => {
      setSuccess(data.message || 'Đổi mật khẩu thành công!');
      setError(null);
      setCurrentPassword('');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSent(false);
      setTimeout(() => setSuccess(null), 5000);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể đổi mật khẩu')),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!code) {
      setError('Vui lòng nhập mã xác nhận OTP');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    changePasswordMutation.mutate();
  }

  return (
    <Card className="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">Đổi mật khẩu tài khoản Owner</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Để đảm bảo an toàn, FitFlow yêu cầu xác thực mã OTP gửi đến email <span className="font-semibold text-zinc-700 dark:text-zinc-300">{me?.email}</span> trước khi đổi mật khẩu.
          </p>
        </div>

        {!otpSent ? (
          <div className="mt-2 flex flex-col gap-3">
            <Callout tone="info">
              Nhấn nút bên dưới để nhận mã xác thực OTP 6 số gửi về email đăng ký của bạn.
            </Callout>
            <div>
              <Button
                type="button"
                disabled={requestOtpMutation.isPending}
                onClick={() => {
                  setError(null);
                  requestOtpMutation.mutate();
                }}
              >
                {requestOtpMutation.isPending ? 'Đang gửi mã OTP...' : 'Gửi mã OTP đổi mật khẩu'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Callout tone="success">
              Mã OTP đã được gửi đến email <strong className="font-semibold">{me?.email}</strong>. Mã có hiệu lực trong 5 phút.
            </Callout>

            <FormField label="Mật khẩu hiện tại (nếu có)" htmlFor="sec-current-password">
              <PasswordInput
                id="sec-current-password"
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
            </FormField>

            <FormField label="Mã xác nhận OTP (6 số) *" htmlFor="sec-otp">
              <input
                id="sec-otp"
                type="text"
                required
                maxLength={6}
                className={`${inputClass} tracking-widest font-mono text-lg w-48`}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Mật khẩu mới *" htmlFor="sec-new-password">
                <PasswordInput
                  id="sec-new-password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={setNewPassword}
                />
              </FormField>

              <FormField label="Xác nhận mật khẩu mới *" htmlFor="sec-confirm-password">
                <PasswordInput
                  id="sec-confirm-password"
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
              </FormField>
            </div>

            <div className="flex justify-between items-center mt-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  requestOtpMutation.mutate();
                }}
                disabled={requestOtpMutation.isPending}
                className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              >
                {requestOtpMutation.isPending ? 'Đang gửi lại...' : 'Gửi lại mã OTP qua email'}
              </button>

              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>}
      </form>
    </Card>
  );
}
