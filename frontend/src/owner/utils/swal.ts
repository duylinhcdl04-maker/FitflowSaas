import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const FitFlowSwal = MySwal.mixin({
  customClass: {
    popup: 'rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 font-sans',
    title: 'font-display text-lg font-bold text-zinc-900 dark:text-zinc-50',
    htmlContainer: 'text-sm text-zinc-600 dark:text-zinc-300 mt-2',
    confirmButton: 'rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 focus:outline-none transition-all mr-2',
    cancelButton: 'rounded-xl bg-stone-200 px-4 py-2 text-sm font-bold text-zinc-700 hover:bg-stone-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 focus:outline-none transition-all',
  },
  buttonsStyling: false,
});

export const Toast = MySwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-xl border border-stone-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 font-sans text-xs',
  },
});

export function showToast(message: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') {
  Toast.fire({
    icon,
    title: message,
  });
}

export async function showConfirm({
  title,
  text,
  confirmButtonText = 'Đồng ý',
  cancelButtonText = 'Hủy bỏ',
  icon = 'question',
}: {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
}) {
  const result = await FitFlowSwal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
  });
  return result.isConfirmed;
}
