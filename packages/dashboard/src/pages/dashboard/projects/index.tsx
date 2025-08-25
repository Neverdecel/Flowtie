import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, FolderIcon, ChartBarIcon, BeakerIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import { Project } from '@/types';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const router = useRouter();

  const { data: projectsData, refetch: refetchProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects(),
  });

  const projects = projectsData?.projects || [];

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will delete all prompts and A/B tests within it.')) return;

    try {
      await apiClient.deleteProject(projectId);
      toast.success('Project deleted successfully');
      refetchProjects();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Projects
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Organize your prompts and A/B tests by project
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Link
              href="/dashboard/projects/new"
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Project
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="mt-6">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first project.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/projects/new"
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Project
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FolderIcon className="h-6 w-6 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {project.description || 'No description'}
                        </p>
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="mt-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-1" />
                            <span className="text-lg font-semibold text-gray-900">
                              {project._count?.prompts || 0}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Prompts</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <BeakerIcon className="h-5 w-5 text-gray-400 mr-1" />
                            <span className="text-lg font-semibold text-gray-900">
                              {project._count?.abTests || 0}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">A/B Tests</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <ChartBarIcon className="h-5 w-5 text-gray-400 mr-1" />
                            <span className="text-lg font-semibold text-gray-900">
                              {project._count?.usageLogs || 0}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Usage</div>
                        </div>
                      </div>
                    </div>

                    {/* Project Actions */}
                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                        className="flex-1 bg-primary-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-primary-700 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium px-3 py-2"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Last Updated */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {projects.length > 0 && (
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/dashboard/prompts/new"
                className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <DocumentTextIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Create Prompt</span>
              </Link>
              <Link
                href="/dashboard/ab-tests/new"
                className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <BeakerIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Create A/B Test</span>
              </Link>
              <Link
                href="/dashboard/analytics"
                className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <ChartBarIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">View Analytics</span>
              </Link>
              <Link
                href="/dashboard/projects/new"
                className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <PlusIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">New Project</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}