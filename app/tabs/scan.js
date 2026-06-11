import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Dummy screen — immediately redirects to QR scanner modal
export default function ScanTab() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/checkin/scanner');
  }, []);
  return null;
}
