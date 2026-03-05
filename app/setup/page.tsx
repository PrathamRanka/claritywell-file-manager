'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/init/seed', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Database seeded successfully!');
        toast.message(`Created users: ${data.users.join(', ')}`);
        window.location.href = '/login';
      } else {
        toast.error(data.error || 'Failed to seed database');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">DocVault Setup</h1>
        
        <p className="text-slate-600 mb-6">
          Initialize the database with test users and departments.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-blue-900">Test Credentials:</p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1">
            <li><strong>Admin:</strong> admin@example.com / password123</li>
            <li><strong>User:</strong> user@example.com / password123</li>
          </ul>
        </div>

        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {loading ? 'Seeding...' : 'Initialize Database'}
        </button>

        <p className="text-xs text-slate-500 text-center mt-4">
          Click the button above to create test users and departments
        </p>
      </div>
    </div>
  );
}
