import { useState, useEffect } from 'react';
import {
  X,
  PaperPlaneTilt,
  CheckCircle,
  WarningCircle,
  ArrowsClockwise,
  Robot,
  UsersThree,
  Key,
  Eye,
  EyeSlash,
  FloppyDisk,
  ArrowRight,
  ArrowLeft,
  Check,
} from '@phosphor-icons/react';
import {
  verifyTelegramBot,
  discoverTelegramChats,
  testTelegramMessage,
  saveTelegramConnection,
  type TelegramChatInfo,
  type TelegramVerifyResult,
} from '../../api/settings';

interface TelegramConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialStep?: 1 | 2 | 3;
}

export default function TelegramConfigDrawer({
  isOpen,
  onClose,
  onSuccess,
  initialStep = 1,
}: TelegramConfigDrawerProps) {
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);

  // Step 1 states
  const [botToken, setBotToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isVerifyingBot, setIsVerifyingBot] = useState(false);
  const [verifyResult, setVerifyResult] = useState<TelegramVerifyResult['bot'] | null>(null);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Step 2 states
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredChats, setDiscoveredChats] = useState<TelegramChatInfo[]>([]);
  const [selectedChat, setSelectedChat] = useState<TelegramChatInfo | null>(null);
  const [isManualChatInput, setIsManualChatInput] = useState(false);
  const [manualChatId, setManualChatId] = useState('');
  const [manualChatTitle, setManualChatTitle] = useState('');
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Step 3 states
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [step3Error, setStep3Error] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setTestSuccess(false);
      setStep1Error(null);
      setStep2Error(null);
      setStep3Error(null);
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  // Handlers
  const handleVerifyBot = async () => {
    if (!botToken.trim()) {
      setStep1Error('Vui lòng nhập Bot Token');
      return;
    }

    setStep1Error(null);
    setIsVerifyingBot(true);
    try {
      const res = await verifyTelegramBot(botToken.trim());
      if (res.valid && res.bot) {
        setVerifyResult(res.bot);
        // Automatically trigger discover chats for step 2
        triggerDiscover(botToken.trim());
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Xác thực Bot Token thất bại';
      setStep1Error(msg);
      setVerifyResult(null);
    } finally {
      setIsVerifyingBot(false);
    }
  };

  const triggerDiscover = async (token: string) => {
    setIsDiscovering(true);
    setStep2Error(null);
    try {
      const res = await discoverTelegramChats(token);
      setDiscoveredChats(res.chats || []);
      if (res.chats && res.chats.length > 0 && !selectedChat) {
        setSelectedChat(res.chats[0]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể quét danh sách chat';
      setStep2Error(msg);
    } finally {
      setIsDiscovering(false);
    }
  };

  const effectiveChatId = isManualChatInput
    ? manualChatId.trim()
    : selectedChat?.id || '';

  const effectiveChatTitle = isManualChatInput
    ? manualChatTitle.trim() || `Chat ${manualChatId}`
    : selectedChat?.title || `Chat ${selectedChat?.id}`;

  const effectiveChatType = isManualChatInput
    ? 'manual'
    : selectedChat?.type || 'group';

  const handleTestMessage = async () => {
    if (!effectiveChatId) {
      setStep3Error('Vui lòng chọn hoặc nhập Chat ID');
      return;
    }

    setStep3Error(null);
    setIsTesting(true);
    setTestSuccess(false);

    try {
      const res = await testTelegramMessage({
        token: botToken.trim(),
        chatId: effectiveChatId,
      });

      if (res.success) {
        setTestSuccess(true);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Gửi tin nhắn kiểm tra thất bại';
      setStep3Error(msg);
      setTestSuccess(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    if (!botToken.trim() || !effectiveChatId) {
      setStep3Error('Thiếu thông tin Bot Token hoặc Chat ID');
      return;
    }

    setIsSaving(true);
    setStep3Error(null);

    try {
      await saveTelegramConnection({
        token: botToken.trim(),
        chatId: effectiveChatId,
        chatTitle: effectiveChatTitle,
        chatType: effectiveChatType,
        botName: verifyResult?.name || 'FitFlow Alert Bot',
        botUsername: verifyResult?.username || '',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Lưu kết nối thất bại';
      setStep3Error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
              <PaperPlaneTilt className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Kết nối Telegram Notifications
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Thiết lập nhận thông báo và cảnh báo sự cố SaaS qua Telegram Bot.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="border-b border-zinc-100 bg-white px-6 py-3 dark:border-zinc-800/80 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 text-xs font-semibold ${
                step === 1
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : verifyResult
                  ? 'text-zinc-700 dark:text-zinc-300'
                  : 'text-zinc-400'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  verifyResult
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : step === 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {verifyResult ? <Check className="h-3.5 w-3.5" /> : '1'}
              </div>
              <span>1. Bot Token</span>
            </button>

            <div className="h-0.5 w-8 bg-zinc-200 dark:bg-zinc-800" />

            {/* Step 2 */}
            <button
              type="button"
              disabled={!verifyResult}
              onClick={() => verifyResult && setStep(2)}
              className={`flex items-center gap-2 text-xs font-semibold ${
                step === 2
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : effectiveChatId
                  ? 'text-zinc-700 dark:text-zinc-300'
                  : 'text-zinc-400 opacity-60'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  effectiveChatId && step > 2
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : step === 2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {effectiveChatId && step > 2 ? <Check className="h-3.5 w-3.5" /> : '2'}
              </div>
              <span>2. Chọn Chat</span>
            </button>

            <div className="h-0.5 w-8 bg-zinc-200 dark:bg-zinc-800" />

            {/* Step 3 */}
            <button
              type="button"
              disabled={!effectiveChatId}
              onClick={() => effectiveChatId && setStep(3)}
              className={`flex items-center gap-2 text-xs font-semibold ${
                step === 3
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : testSuccess
                  ? 'text-zinc-700 dark:text-zinc-300'
                  : 'text-zinc-400 opacity-60'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  testSuccess
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : step === 3
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                3
              </div>
              <span>3. Kiểm tra & Lưu</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* STEP 1: Bot Token */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Telegram Bot Token
                </label>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Lấy token từ <strong>@BotFather</strong> trên Telegram (Ví dụ:{' '}
                  <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11px] dark:bg-zinc-800">
                    123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
                  </code>
                  ).
                </p>

                <div className="mt-3 relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={botToken}
                    onChange={(e) => {
                      setBotToken(e.target.value);
                      if (step1Error) setStep1Error(null);
                    }}
                    placeholder="Dán mã Bot Token vào đây..."
                    className="w-full rounded-xl border border-zinc-300 bg-white pl-9 pr-10 py-2.5 text-sm font-mono text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showToken ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleVerifyBot}
                disabled={isVerifyingBot || !botToken.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer"
              >
                <ArrowsClockwise
                  className={`h-4 w-4 ${isVerifyingBot ? 'animate-spin' : ''}`}
                />
                {isVerifyingBot ? 'Đang kiểm tra kết nối với Telegram...' : 'Kiểm tra Bot'}
              </button>

              {step1Error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                  <WarningCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{step1Error}</span>
                </div>
              )}

              {/* Verified Bot Card Result */}
              {verifyResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3 dark:border-emerald-900/40">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle className="h-4 w-4" weight="fill" />
                      <span>Bot đã được xác thực</span>
                    </div>
                    <span className="rounded bg-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 uppercase">
                      getMe() OK
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow-xs">
                      <Robot className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {verifyResult.name}
                      </h4>
                      <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                        @{verifyResult.username}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-emerald-200/40 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                      <span>Tiếp tục chọn Chat</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Choose Destination / Group */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Chọn cuộc trò chuyện nhận cảnh báo
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Danh sách các Group/Channel mà bot <strong>@{verifyResult?.username}</strong> đã tham gia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerDiscover(botToken.trim())}
                  disabled={isDiscovering}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  <ArrowsClockwise
                    className={`h-3.5 w-3.5 ${isDiscovering ? 'animate-spin' : ''}`}
                  />
                  Làm mới
                </button>
              </div>

              {!isManualChatInput ? (
                <div className="space-y-3">
                  {isDiscovering ? (
                    <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                      <ArrowsClockwise className="h-6 w-6 text-emerald-600 animate-spin" />
                      <p className="mt-2 text-xs text-zinc-500">Đang quét các cập nhật gần đây từ Telegram...</p>
                    </div>
                  ) : discoveredChats.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {discoveredChats.map((c) => {
                        const isSelected = selectedChat?.id === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedChat(c)}
                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50/50 shadow-xs dark:border-emerald-500 dark:bg-emerald-950/20'
                                : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                              >
                                <UsersThree className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                  {c.title}
                                </h4>
                                <p className="text-[11px] font-mono text-zinc-400">
                                  {c.type.toUpperCase()} • ID: {c.id}
                                </p>
                              </div>
                            </div>

                            <div
                              className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-zinc-300 dark:border-zinc-700'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <WarningCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Chưa tìm thấy cuộc trò chuyện nào gần đây</span>
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1 pl-6">
                        <p><strong>Hướng dẫn nhanh:</strong></p>
                        <ol className="list-decimal space-y-1">
                          <li>Thêm bot <strong>@{verifyResult?.username}</strong> vào Telegram Group của bạn.</li>
                          <li>Gửi một tin nhắn bất kỳ trong Group (ví dụ: <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded">/start</code> hoặc <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded">hello</code>).</li>
                          <li>Quay lại đây và bấm nút <strong>Làm mới</strong>.</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setIsManualChatInput(true)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold dark:text-emerald-400 cursor-pointer"
                    >
                      + Nhập Chat ID thủ công
                    </button>

                    {selectedChat && (
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                      >
                        <span>Tiếp tục</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Manual Chat ID fallback */
                <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Nhập Chat ID hoặc Channel Username
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsManualChatInput(false)}
                      className="text-xs text-zinc-500 hover:underline cursor-pointer"
                    >
                      ← Quay lại danh sách tự động
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Telegram Chat ID
                    </label>
                    <input
                      type="text"
                      value={manualChatId}
                      onChange={(e) => setManualChatId(e.target.value)}
                      placeholder="Ví dụ: -1001234567890 hoặc @my_channel"
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-mono text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Tên gợi nhớ (Không bắt buộc)
                    </label>
                    <input
                      type="text"
                      value={manualChatTitle}
                      onChange={(e) => setManualChatTitle(e.target.value)}
                      placeholder="Ví dụ: FitFlow Kênh Cảnh Báo"
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-xs placeholder:text-zinc-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={!manualChatId.trim()}
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <span>Tiếp tục sang Kiểm tra</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {step2Error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                  <WarningCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{step2Error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Quay lại Bước 1
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Test & Save */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Tóm tắt cấu hình
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-400">Bot:</span>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">
                      {verifyResult?.name} (@{verifyResult?.username})
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Nơi nhận:</span>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">
                      {effectiveChatTitle}
                    </p>
                    <p className="font-mono text-[11px] text-zinc-400">
                      ID: {effectiveChatId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Message Box Preview */}
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Nội dung tin nhắn kiểm tra mẫu:
                </label>
                <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50/50 p-4 font-mono text-xs text-zinc-800 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-zinc-200 space-y-2">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    🟢 FitFlow Telegram Connected
                  </p>
                  <p>Telegram notification channel đã được kết nối thành công.</p>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-sky-100 dark:border-sky-900/40">
                    <p>Environment: Production</p>
                    <p>Time: {new Date().toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestMessage}
                disabled={isTesting}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-sky-300 bg-sky-50 px-4 py-2.5 text-xs font-bold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300 dark:hover:bg-sky-900/60 disabled:opacity-50 transition-all cursor-pointer"
              >
                <PaperPlaneTilt className={`h-4 w-4 ${isTesting ? 'animate-bounce' : ''}`} />
                {isTesting ? 'Đang gửi tin nhắn thử...' : 'Gửi tin nhắn kiểm tra'}
              </button>

              {testSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle className="h-4 w-4 text-emerald-600" weight="fill" />
                    <span>Tin nhắn kiểm tra đã được gửi thành công!</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 pl-6">
                    Vui lòng kiểm tra Telegram Group để xác nhận tin nhắn. Bạn đã có thể lưu kết nối này.
                  </p>
                </div>
              )}

              {step3Error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                  <WarningCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{step3Error}</span>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quay lại Bước 2
                </button>

                <button
                  type="button"
                  disabled={!testSuccess || isSaving}
                  onClick={handleSaveConnection}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <FloppyDisk className="h-4 w-4" />
                  {isSaving ? 'Đang lưu kết nối...' : 'Lưu kết nối Telegram'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
