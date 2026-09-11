import { useState, useRef, useEffect } from 'react';
import {
  PaperPlaneTilt,
  CheckCircle,
  DotsThreeVertical,
  Gear,
  ArrowsClockwise,
  Trash,
  Power,
  Robot,
  UsersThree,
} from '@phosphor-icons/react';
import type { TelegramConnectionState } from '../../api/settings';
import {
  testTelegramMessage,
  disconnectTelegram,
  toggleTelegram,
} from '../../api/settings';
import TelegramConfigDrawer from './TelegramConfigDrawer';

interface TelegramChannelCardProps {
  telegram?: TelegramConnectionState;
  onRefresh: () => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export default function TelegramChannelCard({
  telegram,
  onRefresh,
  onToast,
}: TelegramChannelCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<1 | 2 | 3>(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isConnected = telegram?.configured;
  const isActive = telegram?.isActive !== false;

  const handleTest = async () => {
    if (!telegram?.chat?.id) {
      onToast('Không tìm thấy Chat ID để gửi tin nhắn thử', 'error');
      return;
    }

    setIsSendingTest(true);
    try {
      await testTelegramMessage({
        chatId: telegram.chat.id,
      });
      onToast('Đã gửi tin nhắn kiểm tra thành công đến Telegram!');
      onRefresh();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gửi tin nhắn thử thất bại';
      onToast(msg, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await toggleTelegram(!isActive);
      onToast(isActive ? 'Đã tạm dừng nhận thông báo Telegram' : 'Đã kích hoạt lại kênh Telegram');
      onRefresh();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Thao tác thất bại';
      onToast(msg, 'error');
    } finally {
      setIsToggling(false);
      setIsMenuOpen(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn ngắt kết nối kênh Telegram này không?')) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await disconnectTelegram();
      onToast('Đã xóa kết nối Telegram thành công');
      onRefresh();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Xóa kết nối thất bại';
      onToast(msg, 'error');
    } finally {
      setIsDisconnecting(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 transition-all">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
              <PaperPlaneTilt className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Telegram Notifications
                </h3>
                {isConnected ? (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                      }`}
                    />
                    {isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                    Chưa kết nối
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Gửi thông báo và cảnh báo sự cố SaaS trực tiếp vào Telegram Group / Channel.
              </p>
            </div>
          </div>

          {/* Menu options when connected */}
          {isConnected && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <DotsThreeVertical className="h-5 w-5" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerStep(1);
                      setIsDrawerOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <Gear className="h-4 w-4 text-zinc-400" />
                    Cấu hình lại
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDrawerStep(2);
                      setIsDrawerOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <UsersThree className="h-4 w-4 text-zinc-400" />
                    Đổi Chat / Group
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleTest();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <ArrowsClockwise className="h-4 w-4 text-zinc-400" />
                    Kiểm tra kết nối
                  </button>

                  <button
                    type="button"
                    onClick={handleToggle}
                    disabled={isToggling}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <Power className="h-4 w-4 text-zinc-400" />
                    {isActive ? 'Tắt kênh (Pause)' : 'Bật lại kênh'}
                  </button>

                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                    Xóa kết nối
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="mt-5">
          {!isConnected ? (
            /* Disconnected View */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-950/30">
              <div className="text-center sm:text-left">
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Nhận cảnh báo hệ thống qua Telegram
                </h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
                  Kết nối với Telegram Bot để nhận thông báo tức thời khi có Tenant mới đăng ký, nợ phí hoặc phát hiện sự cố bảo mật.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDrawerStep(1);
                  setIsDrawerOpen(true);
                }}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all cursor-pointer"
              >
                <PaperPlaneTilt className="h-4 w-4" />
                Kết nối Telegram
              </button>
            </div>
          ) : (
            /* Connected View */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bot Details Box */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <Robot className="h-4 w-4 text-emerald-600" />
                    <span>Bot Telegram</span>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {telegram.bot?.name || 'FitFlow Alert Bot'}
                    </h4>
                    <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      @{telegram.bot?.username || 'FitFlowAlertBot'}
                    </p>
                  </div>
                </div>

                {/* Destination Details Box */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <UsersThree className="h-4 w-4 text-sky-600" />
                    <span>Nơi nhận cảnh báo</span>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {telegram.chat?.name || 'FitFlow System Alerts'}
                    </h4>
                    <p className="text-xs font-mono text-zinc-400">
                      Chat ID {telegram.chat?.maskedChatId || '••••••••'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status footer and Test action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <CheckCircle className="h-4 w-4 text-emerald-500" weight="fill" />
                  <span>Kết nối hoạt động</span>
                  <span>•</span>
                  <span>
                    Kiểm tra lần cuối:{' '}
                    {telegram.lastCheckedAt
                      ? new Date(telegram.lastCheckedAt).toLocaleString('vi-VN')
                      : 'Gần đây'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={isSendingTest}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    <PaperPlaneTilt
                      className={`h-3.5 w-3.5 ${isSendingTest ? 'animate-bounce' : ''}`}
                    />
                    {isSendingTest ? 'Đang gửi...' : 'Gửi tin nhắn thử'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <TelegramConfigDrawer
        isOpen={isDrawerOpen}
        initialStep={drawerStep}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          onToast('Cấu hình Telegram đã được cập nhật thành công!');
          onRefresh();
        }}
      />
    </>
  );
}
