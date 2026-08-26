import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../../owner/components/Modal';
import Button from '../../owner/components/Button';
import FormField, { inputClass } from '../../owner/components/FormField';
import {
  quickRegisterCustomer,
  manualCheckin,
  quickCreatePayment,
  createPtBooking,
  getManagerCustomers,
  getManagerStaff,
} from '../api/manager';
import { apiErrorMessage } from '../../owner/api/client';

export type QuickActionType = 'REGISTER_CUSTOMER' | 'CHECKIN' | 'CREATE_PAYMENT' | 'BOOK_PT' | null;

interface QuickActionsModalsProps {
  activeAction: QuickActionType;
  onClose: () => void;
}

export default function QuickActionsModals({ activeAction, onClose }: QuickActionsModalsProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Quick Register Customer Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('MALE');

  // 2. Quick Checkin Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [checkinNote, setCheckinNote] = useState('');

  // 3. Quick Payment Form State
  const [paymentTitle, setPaymentTitle] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(500000);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // 4. Quick PT Booking Form State
  const [ptUserId, setPtUserId] = useState('');
  const [ptPackageId, setPtPackageId] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [sessionNote, setSessionNote] = useState('');

  // Fetch Customers & Staff for Select Dropdowns
  const { data: customersList = [] } = useQuery({
    queryKey: ['manager-customers-list', ''],
    queryFn: () => getManagerCustomers(''),
    enabled: !!activeAction,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['manager-staff'],
    queryFn: () => getManagerStaff(),
    enabled: activeAction === 'BOOK_PT',
  });

  // Mutations
  const registerMutation = useMutation({
    mutationFn: () => quickRegisterCustomer({ fullName, phone, email, gender }),
    onSuccess: (data) => {
      setSuccessMsg(`Đã đăng ký thành công hội viên ${data.full_name} (${data.customer_code})!`);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
      setTimeout(() => {
        handleClose();
      }, 1500);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể đăng ký hội viên')),
  });

  const checkinMutation = useMutation({
    mutationFn: () => manualCheckin(selectedCustomerId, undefined, checkinNote),
    onSuccess: () => {
      setSuccessMsg('Đã check-in cho hội viên vào phòng tập thành công!');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['manager-currently-in-gym'] });
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard-overview'] });
      setTimeout(() => {
        handleClose();
      }, 1500);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể check-in')),
  });

  const paymentMutation = useMutation({
    mutationFn: () => quickCreatePayment({ customerId: selectedCustomerId, title: paymentTitle, amount: paymentAmount, paymentMethod }),
    onSuccess: () => {
      setSuccessMsg('Đã tạo giao dịch thanh toán thành công!');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard-overview'] });
      setTimeout(() => {
        handleClose();
      }, 1500);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể tạo thanh toán')),
  });

  const ptBookingMutation = useMutation({
    mutationFn: () => createPtBooking({
      ptUserId,
      customerId: selectedCustomerId,
      customerPtPackageId: ptPackageId || 'default-package',
      scheduledStart,
      scheduledEnd,
      sessionNote,
    }),
    onSuccess: () => {
      setSuccessMsg('Đã đặt lịch tập PT thành công!');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['manager-pt-bookings'] });
      setTimeout(() => {
        handleClose();
      }, 1500);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể đặt lịch PT')),
  });

  function handleClose() {
    setError(null);
    setSuccessMsg(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setSelectedCustomerId('');
    setCheckinNote('');
    setPaymentTitle('');
    setPaymentAmount(500000);
    onClose();
  }

  if (!activeAction) return null;

  return (
    <>
      {/* 1. Modal Đăng ký hội viên */}
      <Modal
        open={activeAction === 'REGISTER_CUSTOMER'}
        onClose={handleClose}
        title="Thao tác nhanh: Đăng ký hội viên mới"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            registerMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          {successMsg && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {successMsg}
            </div>
          )}

          <FormField label="Họ và tên hội viên *" htmlFor="quick-fullname">
            <input
              id="quick-fullname"
              required
              className={inputClass}
              placeholder="VD: Nguyễn Văn An"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </FormField>

          <FormField label="Số điện thoại *" htmlFor="quick-phone">
            <input
              id="quick-phone"
              required
              className={inputClass}
              placeholder="VD: 0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FormField>

          <FormField label="Email (Không bắt buộc)" htmlFor="quick-email">
            <input
              id="quick-email"
              type="email"
              className={inputClass}
              placeholder="an.nguyen@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>

          <FormField label="Giới tính" htmlFor="quick-gender">
            <select
              id="quick-gender"
              className={inputClass}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </FormField>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={registerMutation.isPending}>
              Hoàn tất đăng ký
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal Check-in quầy */}
      <Modal
        open={activeAction === 'CHECKIN'}
        onClose={handleClose}
        title="Thao tác nhanh: Check-in quầy"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            checkinMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          {successMsg && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {successMsg}
            </div>
          )}

          <FormField label="Chọn hội viên check-in *" htmlFor="quick-checkin-customer">
            <select
              id="quick-checkin-customer"
              required
              className={inputClass}
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Chọn hội viên --</option>
              {customersList.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.phone || c.customer_code})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Ghi chú check-in" htmlFor="quick-checkin-note">
            <input
              id="quick-checkin-note"
              className={inputClass}
              placeholder="VD: Quên mang thẻ, check-in thủ công..."
              value={checkinNote}
              onChange={(e) => setCheckinNote(e.target.value)}
            />
          </FormField>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={checkinMutation.isPending || !selectedCustomerId}>
              Xác nhận Check-in
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal Tạo thanh toán */}
      <Modal
        open={activeAction === 'CREATE_PAYMENT'}
        onClose={handleClose}
        title="Thao tác nhanh: Tạo thanh toán"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            paymentMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          {successMsg && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {successMsg}
            </div>
          )}

          <FormField label="Chọn hội viên thanh toán *" htmlFor="quick-payment-customer">
            <select
              id="quick-payment-customer"
              required
              className={inputClass}
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Chọn hội viên --</option>
              {customersList.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.phone || c.customer_code})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Nội dung thanh toán *" htmlFor="quick-payment-title">
            <input
              id="quick-payment-title"
              required
              className={inputClass}
              placeholder="VD: Gói Gold 3 tháng, Vé tập lẻ..."
              value={paymentTitle}
              onChange={(e) => setPaymentTitle(e.target.value)}
            />
          </FormField>

          <FormField label="Số tiền thanh toán (VNĐ) *" htmlFor="quick-payment-amount">
            <input
              id="quick-payment-amount"
              type="number"
              required
              min={10000}
              className={inputClass}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
            />
          </FormField>

          <FormField label="Hình thức thanh toán" htmlFor="quick-payment-method">
            <select
              id="quick-payment-method"
              className={inputClass}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="CASH">Tiền mặt (Cash)</option>
              <option value="TRANSFER">Chuyển khoản (Bank Transfer)</option>
              <option value="CARD">Quẹt thẻ (POS Card)</option>
            </select>
          </FormField>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={paymentMutation.isPending || !selectedCustomerId}>
              Tạo giao dịch
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal Đặt lịch PT */}
      <Modal
        open={activeAction === 'BOOK_PT'}
        onClose={handleClose}
        title="Thao tác nhanh: Đặt lịch tập PT"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ptBookingMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          {successMsg && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {successMsg}
            </div>
          )}

          <FormField label="Chọn Huấn luyện viên (PT) *" htmlFor="quick-pt-user">
            <select
              id="quick-pt-user"
              required
              className={inputClass}
              value={ptUserId}
              onChange={(e) => setPtUserId(e.target.value)}
            >
              <option value="">-- Chọn PT --</option>
              {staffList.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.email})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Chọn Hội viên *" htmlFor="quick-pt-customer">
            <select
              id="quick-pt-customer"
              required
              className={inputClass}
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Chọn hội viên --</option>
              {customersList.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.phone || c.customer_code})
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Bắt đầu *" htmlFor="quick-pt-start">
              <input
                id="quick-pt-start"
                type="datetime-local"
                required
                className={inputClass}
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
              />
            </FormField>

            <FormField label="Kết thúc *" htmlFor="quick-pt-end">
              <input
                id="quick-pt-end"
                type="datetime-local"
                required
                className={inputClass}
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Ghi chú buổi tập" htmlFor="quick-pt-note">
            <input
              id="quick-pt-note"
              className={inputClass}
              placeholder="VD: Tập ngực + Vai, học viên mới..."
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
            />
          </FormField>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={ptBookingMutation.isPending || !selectedCustomerId || !ptUserId}>
              Xác nhận đặt lịch PT
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
