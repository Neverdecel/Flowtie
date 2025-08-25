import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeftIcon,
  PencilIcon,
  DocumentTextIcon,
  BeakerIcon,
  ChartBarIcon,
  PlusIcon,
  KeyIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import toast from 'react-hot-toast';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type ProjectForm = z.infer<typeof projectSchema>;

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => apiClient.getProject(id as string),
    enabled: !!id,
  });

  const { data: promptsData } = useQuery({
    queryKey: ['prompts', id],
    queryFn: () => apiClient.getPrompts(id as string),
    enabled: !!id,
  });

  const { data: abTestsData } = useQuery({
    queryKey: ['ab-tests', id],
    queryFn: () => apiClient.getABTests(id as string),
    enabled: !!id,
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: ProjectForm) => apiClient.updateProject(id as string, data),
    onSuccess: () => {
      toast.success('Project updated successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const regenerateKeyMutation = useMutation({
    mutationFn: () => apiClient.regenerateApiKey(id as string),
    onSuccess: () => {
      toast.success('New API key generated!');
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
  });

  const project = projectData?.project;
  const prompts = promptsData?.prompts || [];
  const abTests = abTestsData?.abTests || [];

  // Initialize form when project data loads
  React.useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
      });
    }
  }, [project, reset]);

  const onSubmit = async (data: ProjectForm) => {
    updateProjectMutation.mutate(data);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('API key copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleRegenerateKey = () => {
    if (confirm('Are you sure you want to regenerate the API key? This will invalidate the current key and may break existing integrations.')) {
      regenerateKeyMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading project...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-500">Project not found</p>
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="mt-4 btn-primary"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Projects
            </button>

            {!isEditing ? (
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                  <p className="mt-1 text-lg text-gray-500">
                    {project.description || 'No description provided'}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-outline"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit Project
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Project Name
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="form-input mt-1"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    {...register('description')}
                    type="text"
                    className="form-input mt-1"
                    placeholder="Brief description of the project"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || updateProjectMutation.isPending}
                    className="btn-primary"
                  >
                    {isSubmitting || updateProjectMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      reset();
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-8 w-8 text-primary-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Prompts</p>
                      <p className="text-2xl font-semibold text-gray-900">{prompts.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <BeakerIcon className="h-8 w-8 text-primary-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">A/B Tests</p>
                      <p className="text-2xl font-semibold text-gray-900">{abTests.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8 text-primary-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Usage</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {prompts.reduce((sum, prompt) => sum + prompt._count.usageLogs, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Prompts */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Recent Prompts</h3>
                    <Link
                      href={`/dashboard/prompts/new?project=${id}`}
                      className="btn-outline btn-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      New Prompt
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  {prompts.length === 0 ? (
                    <div className="text-center py-6">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No prompts in this project yet.</p>
                      <Link
                        href={`/dashboard/prompts/new?project=${id}`}
                        className="btn-primary mt-4"
                      >
                        Create Your First Prompt
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prompts.slice(0, 5).map((prompt) => (
                        <div key={prompt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{prompt.name}</h4>
                            <p className="text-xs text-gray-500">
                              v{prompt.version} • {prompt._count.usageLogs} uses
                            </p>
                          </div>
                          <Link
                            href={`/dashboard/prompts/${prompt.id}`}
                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      ))}
                      {prompts.length > 5 && (
                        <Link
                          href={`/dashboard/prompts?project=${id}`}
                          className="block text-center text-primary-600 hover:text-primary-900 text-sm font-medium pt-2"
                        >
                          View all {prompts.length} prompts
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent A/B Tests */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Recent A/B Tests</h3>
                    <Link
                      href={`/dashboard/ab-tests/new?project=${id}`}
                      className="btn-outline btn-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      New A/B Test
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  {abTests.length === 0 ? (
                    <div className="text-center py-6">
                      <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No A/B tests in this project yet.</p>
                      <Link
                        href={`/dashboard/ab-tests/new?project=${id}`}
                        className="btn-primary mt-4"
                      >
                        Create Your First A/B Test
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {abTests.slice(0, 5).map((test) => (
                        <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{test.name}</h4>
                            <p className="text-xs text-gray-500">
                              {test.status} • {test._count.results} results
                            </p>
                          </div>
                          <Link
                            href={`/dashboard/ab-tests/${test.id}`}
                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                          >
                            View
                          </Link>
                        </div>
                      ))}
                      {abTests.length > 5 && (
                        <Link
                          href={`/dashboard/ab-tests?project=${id}`}
                          className="block text-center text-primary-600 hover:text-primary-900 text-sm font-medium pt-2"
                        >
                          View all {abTests.length} A/B tests
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* API Key */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <KeyIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">API Key</h3>
                    </div>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {showApiKey ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded">
                        {showApiKey 
                          ? `ftie_${project.id}`
                          : '••••••••••••••••••••••••••••••••'
                        }
                      </div>
                      <button
                        onClick={() => copyToClipboard(`ftie_${project.id}`)}
                        className="flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border rounded"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={handleRegenerateKey}
                      disabled={regenerateKeyMutation.isPending}
                      className="w-full text-sm text-red-600 hover:text-red-900"
                    >
                      {regenerateKeyMutation.isPending ? 'Regenerating...' : 'Regenerate Key'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Project Info</h3>
                </div>
                <div className="card-body">
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Project ID</dt>
                      <dd className="font-mono text-gray-900">{project.id}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Created</dt>
                      <dd className="text-gray-900">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Last Updated</dt>
                      <dd className="text-gray-900">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-2">
                    <Link
                      href={`/dashboard/prompts/new?project=${id}`}
                      className="block w-full btn-outline text-center"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-1 inline" />
                      Create Prompt
                    </Link>
                    <Link
                      href={`/dashboard/ab-tests/new?project=${id}`}
                      className="block w-full btn-outline text-center"
                    >
                      <BeakerIcon className="h-4 w-4 mr-1 inline" />
                      Create A/B Test
                    </Link>
                    <Link
                      href={`/dashboard/analytics?project=${id}`}
                      className="block w-full btn-outline text-center"
                    >
                      <ChartBarIcon className="h-4 w-4 mr-1 inline" />
                      View Analytics
                    </Link>
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