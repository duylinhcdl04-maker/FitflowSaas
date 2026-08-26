import { useNavigate } from 'react-router-dom';
import { HourglassHigh } from '@phosphor-icons/react';
import Card from '../../components/Card';
import Button from '../../components/Button';

// X. Màn hình Trial Expired (BE_Owner.md) — Access Mode = READ_ONLY, dữ liệu
// vẫn được lưu an toàn. Owner chọn gói xong sẽ chuyển sang OW-07 (SubscriptionPage).
export default function TrialExpiredPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <Card className="w-full">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <HourglassHigh size={28} weight="fill" />
        </span>
        <h1 className="font-display mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">Thời gian dùng thử đã kết thúc</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Cảm ơn bạn đã trải nghiệm FitFlow.</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Dữ liệu của bạn vẫn được lưu an toàn.</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Chọn gói phù hợp để tiếp tục vận hành phòng tập.</p>
        <Button size="lg" className="mt-6 w-full justify-center" onClick={() => navigate('/owner/subscription')}>
          Xem các gói sử dụng
        </Button>
        <button
          type="button"
          onClick={() => navigate('/owner')}
          className="mt-3 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Để sau, vào Dashboard
        </button>
      </Card>
    </div>
  );
}
