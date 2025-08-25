import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  UserIcon, 
  KeyIcon, 
  BellIcon, 
  CogIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [notifications, setNotifications] = useState({
    promptUpdates: true,
    abTestResults: true,
    systemAlerts: false,
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => apiClient.getMe(),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => apiClient.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userData?.user?.name || '',
      email: userData?.user?.email || '',
    },
  });

  const user = userData?.user;
  const projects = projectsData?.projects || [];

  const onSubmit = async (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const generateNewApiKey = async (projectId: string) => {
    try {
      await apiClient.regenerateApiKey(projectId);
      toast.success('New API key generated!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      toast.error('Failed to generate new API key');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Profile</h3>
                </div>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        {...register('name')}
                        type="text"
                        className="form-input mt-1"
                        placeholder="Your full name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        className="form-input mt-1"
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || updateProfileMutation.isPending}
                      className="btn-primary"
                    >
                      {isSubmitting || updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* API Keys */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <KeyIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">API Keys</h3>
                  </div>
                  <button
                    onClick={() => setShowApiKeys(!showApiKeys)}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showApiKeys ? (
                      <>
                        <EyeSlashIcon className="h-4 w-4 mr-1" />
                        Hide Keys
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Show Keys
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="card-body">
                <p className="text-sm text-gray-500 mb-4">
                  Use these API keys to integrate Flowtie with your applications. Keep them secure and never share them publicly.
                </p>
                
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{project.name}</h4>
                        <button
                          onClick={() => generateNewApiKey(project.id)}
                          className="text-sm text-primary-600 hover:text-primary-900"
                        >
                          Regenerate
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded">
                          {showApiKeys 
                            ? `ftie_${project.id.substring(0, 8)}...${project.id.substring(-8)}`
                            : '••••••••••••••••••••••••••••••••'
                          }
                        </div>
                        <button
                          onClick={() => copyToClipboard(`ftie_${project.id}`)}
                          className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border rounded"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {projects.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <KeyIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No projects found. Create a project to get API keys.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center">
                  <BellIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                </div>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Prompt Updates</h4>
                      <p className="text-sm text-gray-500">Get notified when prompts are updated</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.promptUpdates}
                        onChange={(e) => setNotifications(prev => ({
                          ...prev,
                          promptUpdates: e.target.checked
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">A/B Test Results</h4>
                      <p className="text-sm text-gray-500">Get notified about A/B test performance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.abTestResults}
                        onChange={(e) => setNotifications(prev => ({
                          ...prev,
                          abTestResults: e.target.checked
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">System Alerts</h4>
                      <p className="text-sm text-gray-500">Get notified about system maintenance and issues</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.systemAlerts}
                        onChange={(e) => setNotifications(prev => ({
                          ...prev,
                          systemAlerts: e.target.checked
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center">
                  <CogIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Account</h3>
                </div>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Account Information</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                      <div>
                        <dt className="text-gray-500">User ID</dt>
                        <dd className="font-mono text-gray-900">{user?.id}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Member Since</dt>
                        <dd className="text-gray-900">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </dd>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-red-900 mb-2">Danger Zone</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      These actions are permanent and cannot be undone.
                    </p>
                    <button className="btn-outline text-red-600 border-red-300 hover:bg-red-50">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}