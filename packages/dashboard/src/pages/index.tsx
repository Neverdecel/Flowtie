import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/utils/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiClient.getMe();
        router.push('/dashboard');
      } catch (error) {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Flowtie</h1>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  );
}