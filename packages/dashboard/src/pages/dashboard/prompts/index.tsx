import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, DocumentTextIcon, BeakerIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import { Prompt } from '@/types';
import toast from 'react-hot-toast';

export default function PromptsPage() {
  const router = useRouter();
  const { project: projectParam } = router.query;
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectParam as string || '');

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: promptsData, refetch: refetchPrompts } = useQuery({
    queryKey: ['prompts', selectedProjectId],
    queryFn: () => apiClient.getPrompts(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const projects = projectsData?.projects || [];
  const prompts = promptsData?.prompts || [];

  // Auto-select first project if none selected
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      await apiClient.deletePrompt(promptId);
      toast.success('Prompt deleted successfully');
      refetchPrompts();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Prompts
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage and version your AI prompts with hot reloading
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Link
              href="/dashboard/prompts/new"
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Prompt
            </Link>
          </div>
        </div>

        {/* Project Selector */}
        {projects.length > 1 && (
          <div className="mt-6">
            <label htmlFor="project" className="block text-sm font-medium text-gray-700">
              Select Project
            </label>
            <select
              id="project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Prompts List */}
        <div className="mt-6">
          {prompts.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No prompts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first prompt.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/prompts/new"
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Prompt
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {prompts.map((prompt) => (
                  <li key={prompt.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                              <DocumentTextIcon className="h-6 w-6 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900">
                                {prompt.name}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prompt.status)}`}>
                                {prompt.status.toLowerCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                v{prompt.version}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {prompt.description || 'No description'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {prompt._count.usageLogs} uses • {prompt._count.versions} versions • 
                              Updated {new Date(prompt.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/dashboard/prompts/${prompt.id}`}
                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeletePrompt(prompt.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Preview content */}
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Content Preview:</div>
                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border-l-2 border-primary-200">
                          {prompt.content.length > 200 
                            ? `${prompt.content.substring(0, 200)}...` 
                            : prompt.content
                          }
                        </div>
                      </div>

                      {/* Variables */}
                      {Object.keys(prompt.variables).length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1">Variables:</div>
                          <div className="flex flex-wrap gap-1">
                            {Object.keys(prompt.variables).map((key) => (
                              <span
                                key={key}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                              >
                                {key}: {JSON.stringify(prompt.variables[key])}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}