import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  Bank,
  QrCode,
  Key,
  Copy,
  Check,
  FloppyDisk,
  Eye,
  EyeSlash,
  ArrowSquareOut,
  Sparkle,
  ShieldCheck,
  CheckCircle,
  Warning,
  Clock,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import {
  listPlatformBanks,
  type PlatformPaymentSettings,
  type VietQrBank,
} from '../../api/settings';
import FormField, { inputClass } from '../../components/FormField';
import Button from '../../components/Button';
import Toggle from '../../components/Toggle';

// Fallback banks in case VietQR API is slow or offline
const FALLBACK_BANKS: Partial<VietQrBank>[] = [
  { code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng Kỹ thương Việt Nam', logo: 'https://api.vietqr.io/img/TCB.png' },
  { code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng Ngoại thương Việt Nam', logo: 'https://api.vietqr.io/img/VCB.png' },
  { code: 'MB', shortName: 'MBBank', name: 'Ngân hàng Quân đội', logo: 'https://api.vietqr.io/img/MB.png' },
  { code: 'ACB', shortName: 'ACB', name: 'Ngân hàng Á Châu', logo: 'https://api.vietqr.io/img/ACB.png' },
  { code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển Việt Nam', logo: 'https://api.vietqr.io/img/BIDV.png' },
  { code: 'CTG', shortName: 'VietinBank', name: 'Ngân hàng Công thương Việt Nam', logo: 'https://api.vietqr.io/img/ICB.png' },
  { code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng Tiên Phong', logo: 'https://api.vietqr.io/img/TPB.png' },
  { code: 'VPB', shortName: 'VPBank', name: 'Ngân hàng Việt Nam Thịnh Vượng', logo: 'https://api.vietqr.io/img/VPB.png' },
  { code: 'STB', shortName: 'Sacombank', name: 'Ngân hàng Sài Gòn Thương Tín', logo: 'https://api.vietqr.io/img/STB.png' },
  { code: 'OCB', shortName: 'OCB', name: 'Ngân hàng Phương Đông', logo: 'https://api.vietqr.io/img/OCB.png' },
  { code: 'VIB', shortName: 'VIB', name: 'Ngân hàng Quốc tế', logo: 'https://api.vietqr.io/img/VIB.png' },
  { code: 'HDB', shortName: 'HDBank', name: 'Ngân hàng Phát triển TP.HCM', logo: 'https://api.vietqr.io/img/HDB.png' },
];

interface PaymentTabProps {
  data: PlatformPaymentSettings;
  onChange: (data: PlatformPaymentSettings) => void;
  onSave: () => void;
  isSaving: boolean;
  error?: string;
  updatedAt?: string | null;
}

export default function PaymentTab({
  data,
  onChange,
  onSave,
  isSaving,
  error,
  updatedAt,
}: PaymentTabProps) {
  const [copied, setCopied] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch live banks list from backend/VietQR
  const { data: apiBanks, isLoading: isBanksLoading } = useQuery({
    queryKey: ['platform-banks'],
    queryFn: listPlatformBanks,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const banks = (apiBanks && apiBanks.length > 0 ? apiBanks : FALLBACK_BANKS) as VietQrBank[];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBanks = banks.filter((b) => {
    if (!bankSearch.trim()) return true;
    const q = bankSearch.toLowerCase();
    return (
      (b.shortName && b.shortName.toLowerCase().includes(q)) ||
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.code && b.code.toLowerCase().includes(q))
    );
  });

  const selectedBank = banks.find(
    (b) => b.code?.toUpperCase() === data.bankCode?.toUpperCase()
  );

  // Fallback webhook url calculation if not provided
  const computedWebhookUrl =
    data.webhookUrl ||
    `${window.location.origin.replace(':3000', ':5000').replace(':5173', ':5000')}/api/v1/webhooks/sepay/platform`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(computedWebhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Preview VietQR URL generator
  const qrTemplate = data.qrTemplate || 'compact2';
  const qrBankCode = data.bankCode || 'TCB';
  const qrAccountNumber = data.accountNumber || '9961708655';
  const qrAccountName = data.accountName || 'FITFLOW SAAS';
  const previewQrUrl = `https://img.vietqr.io/image/${qrBankCode}-${qrAccountNumber}-${qrTemplate}.png?amount=500000&addInfo=HD-DEMO&accountName=${encodeURIComponent(
    qrAccountName
  )}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Settings (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Card 1: Bank Account Configuration */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Bank className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Tài khoản Ngân hàng Thụ hưởng (VietQR)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tài khoản nhận tiền thanh toán khi Chủ phòng Gym (Owner) mua hoặc gia hạn gói SaaS FitFlow.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-5">
              {/* Bank Selector Dropdown */}
              <div className="flex flex-col gap-1.5" ref={bankDropdownRef}>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Chọn Ngân hàng thụ hưởng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsBankDropdownOpen((v) => !v)}
                    className={`${inputClass} flex items-center justify-between gap-3 text-left`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {selectedBank?.logo ? (
                        <img
                          src={selectedBank.logo}
                          alt={selectedBank.shortName}
                          className="h-5 w-auto max-w-[48px] object-contain rounded-xs"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Bank className="h-4 w-4 text-zinc-400 shrink-0" />
                      )}
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {selectedBank
                          ? `${selectedBank.shortName} - ${selectedBank.name}`
                          : data.bankName || data.bankCode || 'Chọn ngân hàng...'}
                      </span>
                    </div>
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 shrink-0">
                      {data.bankCode || 'Chọn'}
                    </span>
                  </button>

                  {isBankDropdownOpen && (
                    <div className="absolute left-0 top-full z-30 mt-1.5 w-full rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
                      <div className="mb-2">
                        <input
                          type="text"
                          placeholder="Tìm theo tên hoặc mã ngân hàng..."
                          className={`${inputClass} text-xs py-1.5`}
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {isBanksLoading && (
                          <div className="p-3 text-center text-xs text-zinc-400">
                            Đang tải danh sách ngân hàng...
                          </div>
                        )}
                        {filteredBanks.map((bank) => {
                          const isCurrent = bank.code === data.bankCode;
                          return (
                            <button
                              key={bank.code || bank.id}
                              type="button"
                              onClick={() => {
                                onChange({
                                  ...data,
                                  bankCode: bank.code,
                                  bankName: bank.shortName || bank.name,
                                });
                                setIsBankDropdownOpen(false);
                                setBankSearch('');
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors text-left ${
                                isCurrent
                                  ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300'
                                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {bank.logo && (
                                  <img
                                    src={bank.logo}
                                    alt={bank.shortName}
                                    className="h-4 w-auto max-w-[40px] object-contain shrink-0"
                                  />
                                )}
                                <span className="truncate">
                                  <strong>{bank.shortName}</strong> - {bank.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400 uppercase shrink-0 ml-2">
                                {bank.code}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Code & Bank Name display/override */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Mã ngân hàng (VietQR Code)" htmlFor="bankCode">
                  <input
                    id="bankCode"
                    type="text"
                    className={`${inputClass} font-mono uppercase`}
                    placeholder="TCB, VCB, MB..."
                    value={data.bankCode ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        bankCode: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </FormField>

                <FormField label="Tên ngân hàng" htmlFor="bankName">
                  <input
                    id="bankName"
                    type="text"
                    className={inputClass}
                    placeholder="Techcombank, Vietcombank..."
                    value={data.bankName ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        bankName: e.target.value,
                      })
                    }
                  />
                </FormField>
              </div>

              {/* Account Number & Account Name */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Số tài khoản ngân hàng *" htmlFor="accountNumber">
                  <input
                    id="accountNumber"
                    type="text"
                    required
                    className={`${inputClass} font-mono tracking-wider font-semibold text-emerald-700 dark:text-emerald-400`}
                    placeholder="Ví dụ: 9961708655"
                    value={data.accountNumber ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        accountNumber: e.target.value.replace(/\s+/g, ''),
                      })
                    }
                  />
                </FormField>

                <FormField label="Tên chủ tài khoản (Chữ hoa) *" htmlFor="accountName">
                  <input
                    id="accountName"
                    type="text"
                    required
                    className={`${inputClass} uppercase font-medium`}
                    placeholder="Ví dụ: FITFLOW SAAS - NGUYEN DUY LINH"
                    value={data.accountName ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        accountName: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </FormField>
              </div>

              {/* QR Template */}
              <FormField label="Mẫu giao diện mã VietQR" htmlFor="qrTemplate">
                <select
                  id="qrTemplate"
                  className={inputClass}
                  value={data.qrTemplate || 'compact2'}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      qrTemplate: e.target.value as 'compact2' | 'compact' | 'qr_only',
                    })
                  }
                >
                  <option value="compact2">compact2 (Khuyên dùng - Đầy đủ Logo ngân hàng, Mã QR & Tên tài khoản)</option>
                  <option value="compact">compact (Mẫu gọn chuẩn VietQR)</option>
                  <option value="qr_only">qr_only (Chỉ mã QR thuần không viền khung)</option>
                </select>
              </FormField>
            </div>
          </div>

          {/* Card 2: SePay Integration & Webhook */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                <Key className="h-5 w-5" weight="duotone" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Tích hợp SePay Webhook (Tự động Kích hoạt Gói)
                  </h2>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    Webhook Gateway
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  SePay tự động đồng bộ biến động số dư ngân hàng và gọi Webhook về FitFlow để mở khóa gói SaaS lập tức.
                </p>
              </div>
              <a
                href="https://my.sepay.vn"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                Trang SePay <ArrowSquareOut className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="mt-6 flex flex-col gap-5">
              {/* Webhook URL Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>URL Webhook Nền tảng (Platform Webhook URL)</span>
                  <span className="text-xs text-zinc-400 font-normal">Dán vào SePay Dashboard → Cấu hình Webhooks</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      readOnly
                      className={`${inputClass} bg-zinc-50 font-mono text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300 cursor-text select-all`}
                      value={computedWebhookUrl}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyWebhook}
                    className="shrink-0 flex items-center gap-1.5 text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" weight="bold" />
                        <span className="text-emerald-600 font-semibold">Đã chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* SePay API Key */}
              <FormField
                label="Mã Token Bảo mật SePay (SePay API Key / Token)"
                htmlFor="sepayApiKey"
              >
                <div className="relative">
                  <input
                    id="sepayApiKey"
                    type={showApiKey ? 'text' : 'password'}
                    className={`${inputClass} pr-24 font-mono text-sm`}
                    placeholder={
                      data.sepayApiKeyMasked
                        ? `Giữ nguyên (${data.sepayApiKeyMasked})`
                        : 'Nhập API Token SePay...'
                    }
                    value={data.sepayApiKey ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        sepayApiKey: e.target.value,
                      })
                    }
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {data.sepayApiKeyMasked && !data.sepayApiKey && (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Đã thiết lập
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showApiKey ? (
                        <EyeSlash className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Mã API Key do SePay cung cấp trong phần cài đặt tài khoản. Khóa này dùng để xác thực webhook IPN gửi về hệ thống FitFlow.
                </p>
              </FormField>
            </div>
          </div>

          {/* Card 3: SaaS Payment Rules */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Clock className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Quy tắc Xử lý Thanh toán SaaS
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Cấu hình thời hạn giữ hóa đơn và cơ chế tự động gia hạn thuê bao.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Thời hạn thanh toán hóa đơn (Ngày)"
                  htmlFor="invoiceDueDays"
                >
                  <input
                    id="invoiceDueDays"
                    type="number"
                    min={1}
                    max={30}
                    className={inputClass}
                    placeholder="3"
                    value={data.invoiceDueDays ?? 3}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        invoiceDueDays: e.target.value ? Number(e.target.value) : 3,
                      })
                    }
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Số ngày hiệu lực trước khi hóa đơn chưa thanh toán chuyển sang trạng thái quá hạn (OVERDUE).
                  </p>
                </FormField>
              </div>

              <div className="flex flex-col gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Tự động Kích hoạt Gói cước (Auto-Activation)
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Tự động nâng cấp gói tập và gia hạn ngày hết hạn cho phòng Gym ngay khi nhận webhook thanh toán hợp lệ.
                    </span>
                  </div>
                  <Toggle
                    checked={data.autoActivateOnPayment ?? true}
                    onChange={(checked) =>
                      onChange({ ...data, autoActivateOnPayment: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Cho phép Giả lập Thanh toán (Dev / Sandbox)
                      </span>
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        Môi trường Test
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Hiển thị nút "Xác nhận thanh toán giả lập" trên giao diện Owner để đội ngũ kiểm thử flow mà không cần chuyển khoản thật.
                    </span>
                  </div>
                  <Toggle
                    checked={data.allowSimulationInDev ?? true}
                    onChange={(checked) =>
                      onChange({ ...data, allowSimulationInDev: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live VietQR Preview & Action Box (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* VietQR Live Preview Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-emerald-600" weight="bold" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Xem trước VietQR
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Sparkle className="h-3 w-3" /> Trực tiếp
              </span>
            </div>

            <div className="mt-4 flex flex-col items-center">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800/60 shadow-inner">
                <img
                  src={previewQrUrl}
                  alt="VietQR Live Preview"
                  className="max-h-72 w-auto object-contain rounded-lg shadow-xs"
                  loading="lazy"
                />
              </div>

              <div className="mt-4 w-full rounded-xl bg-zinc-50 p-3.5 dark:bg-zinc-800/40 text-xs space-y-2">
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Ngân hàng:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {data.bankCode || 'TCB'} ({data.bankName || 'Techcombank'})
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Số tài khoản:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {data.accountNumber || '9961708655'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Chủ tài khoản:</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate ml-2">
                    {data.accountName || 'FITFLOW SAAS'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  <span>Nội dung mẫu:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    HD-2026-0001
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Checklist */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" weight="bold" />
              Các bước cấu hình chuẩn
            </h3>
            <ul className="mt-3 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" weight="fill" />
                <span>Nhập đúng số tài khoản & tên chủ tài khoản ngân hàng thụ hưởng.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" weight="fill" />
                <span>Sao chép Webhook URL dán vào mục Webhook trên tài khoản SePay.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" weight="fill" />
                <span>Lấy API Key từ SePay điền vào ô mã bảo mật bên trên.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" weight="fill" />
                <span>Bấm lưu cấu hình để cập nhật thông tin ngay cho tất cả tenant.</span>
              </li>
            </ul>
          </div>

          {/* Save Action Box */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                <Warning className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              onClick={onSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold shadow-md shadow-emerald-500/10"
            >
              <FloppyDisk className="h-4 w-4" weight="bold" />
              <span>{isSaving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình thanh toán'}</span>
            </Button>

            {updatedAt && (
              <p className="mt-3 text-center text-xs text-zinc-400">
                Cập nhật lần cuối: {new Date(updatedAt).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
