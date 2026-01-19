// components/GlobalLoader.tsx
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export function Loader() {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="w-9 h-9 border-4 border-t-primary border-t-4 border-gray-200 rounded-full animate-spin"></div>
    </div>
  );
}

export const GlobalLoader = () => {
  const loading = useSelector((state: RootState) => state.ui.loading);
  return loading ? <Loader /> : null;
};
