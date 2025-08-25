import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, BeakerIcon, PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import { ABTest } from '@/types';
import toast from 'react-hot-toast';

export default function ABTestsPage() {
  const router = useRouter();
  const { project: projectParam } = router.query;
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectParam as string || '');

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: abTestsData, refetch: refetchABTests } = useQuery({
    queryKey: ['ab-tests', selectedProjectId],
    queryFn: () => apiClient.getABTests(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const projects = projectsData?.projects || [];
  const abTests = abTestsData?.abTests || [];

  // Auto-select first project if none selected
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const handleStatusChange = async (testId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      let newStatus;
      switch (action) {
        case 'start':
          newStatus = 'ACTIVE';
          break;
        case 'pause':
          newStatus = 'PAUSED';
          break;
        case 'stop':
          newStatus = 'COMPLETED';
          break;
      }

      await apiClient.updateABTest(testId, { status: newStatus });
      toast.success(`A/B test ${action}ed successfully`);
      refetchABTests();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDeleteABTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this A/B test?')) return;

    try {
      await apiClient.deleteABTest(testId);
      toast.success('A/B test deleted successfully');
      refetchABTests();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <PlayIcon className="h-4 w-4" />;
      case 'PAUSED': return <PauseIcon className="h-4 w-4" />;
      case 'COMPLETED': return <StopIcon className="h-4 w-4" />;
      default: return <BeakerIcon className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              A/B Tests
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage A/B tests to optimize your prompts
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Link
              href="/dashboard/ab-tests/new"
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New A/B Test
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

        {/* A/B Tests List */}
        <div className="mt-6">
          {abTests.length === 0 ? (
            <div className="text-center py-12">
              <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No A/B tests</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first A/B test.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/ab-tests/new"
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New A/B Test
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {abTests.map((test) => (
                  <li key={test.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                              <BeakerIcon className="h-6 w-6 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900">
                                {test.name}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                                {getStatusIcon(test.status)}
                                <span className="ml-1">{test.status.toLowerCase()}</span>
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {test.description || 'No description'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {test._count.results} results • {test.variants.length} variants • 
                              Updated {new Date(test.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Status control buttons */}
                          {test.status === 'DRAFT' && (
                            <button
                              onClick={() => handleStatusChange(test.id, 'start')}
                              className="text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                              Start
                            </button>
                          )}
                          {test.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(test.id, 'pause')}
                                className="text-yellow-600 hover:text-yellow-900 text-sm font-medium"
                              >
                                Pause
                              </button>
                              <button
                                onClick={() => handleStatusChange(test.id, 'stop')}
                                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                              >
                                Stop
                              </button>
                            </>
                          )}
                          {test.status === 'PAUSED' && (
                            <button
                              onClick={() => handleStatusChange(test.id, 'start')}
                              className="text-green-600 hover:text-green-900 text-sm font-medium"
                            >
                              Resume
                            </button>
                          )}
                          
                          <Link
                            href={`/dashboard/ab-tests/${test.id}`}
                            className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteABTest(test.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Variants */}
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Variants:</div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {test.variants.map((variant) => (
                            <div
                              key={variant.id}
                              className="bg-gray-50 p-2 rounded border"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-700">
                                  {variant.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {(variant.traffic * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {variant._count.results} results
                              </div>
                              {/* Traffic visualization */}
                              <div className="mt-1">
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div
                                    className="bg-primary-600 h-1 rounded-full"
                                    style={{ width: `${variant.traffic * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quick stats */}
                      {test._count.results > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-lg font-semibold text-blue-900">
                              {test._count.results}
                            </div>
                            <div className="text-xs text-blue-700">Total Tests</div>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <div className="text-lg font-semibold text-green-900">
                              {test.variants.reduce((sum, v) => sum + v._count.results, 0)}
                            </div>
                            <div className="text-xs text-green-700">Variant Results</div>
                          </div>
                          <div className="bg-purple-50 p-2 rounded">
                            <div className="text-lg font-semibold text-purple-900">
                              {test.status === 'ACTIVE' ? 'Running' : 'Stopped'}
                            </div>
                            <div className="text-xs text-purple-700">Status</div>
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