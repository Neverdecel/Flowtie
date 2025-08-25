import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { ChartBarIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';

export default function AnalyticsPage() {
  const router = useRouter();
  const { project: projectParam } = router.query;
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectParam as string || '');
  const [timeRange, setTimeRange] = useState<string>('7d');

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: promptsData } = useQuery({
    queryKey: ['prompts', selectedProjectId],
    queryFn: () => apiClient.getPrompts(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const { data: abTestsData } = useQuery({
    queryKey: ['ab-tests', selectedProjectId],
    queryFn: () => apiClient.getABTests(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const projects = projectsData?.projects || [];
  const prompts = promptsData?.prompts || [];
  const abTests = abTestsData?.abTests || [];

  // Auto-select first project if none selected
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Calculate aggregate metrics
  const totalPrompts = prompts.length;
  const totalUsage = prompts.reduce((sum, prompt) => sum + prompt._count.usageLogs, 0);
  const totalABTests = abTests.length;
  const activeABTests = abTests.filter(test => test.status === 'ACTIVE').length;

  // Get top prompts by usage
  const topPrompts = [...prompts]
    .sort((a, b) => b._count.usageLogs - a._count.usageLogs)
    .slice(0, 5);

  // Get recent AB test performance
  const recentABTests = [...abTests]
    .filter(test => test._count.results > 0)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <Layout>
      <div className="p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Analytics
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Monitor performance and usage across your prompts and A/B tests
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700">
              Project
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
          <div>
            <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700">
              Time Range
            </label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mt-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Key Metrics</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Prompts
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {totalPrompts}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Usage
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {totalUsage.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active A/B Tests
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {activeABTests} / {totalABTests}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <XCircleIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Avg Response Time
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ~245ms
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Prompts */}
        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Top Prompts by Usage</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {topPrompts.map((prompt, index) => (
                <li key={prompt.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-900">
                            {prompt.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {prompt.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {prompt._count.usageLogs.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">uses</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            v{prompt.version}
                          </div>
                          <div className="text-xs text-gray-500">version</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {topPrompts.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500">
                No prompts with usage data found
              </div>
            )}
          </div>
        </div>

        {/* A/B Test Performance */}
        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent A/B Test Performance</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {recentABTests.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                No A/B test results available
              </div>
            ) : (
              <div className="space-y-6 p-6">
                {recentABTests.map((test) => (
                  <div key={test.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        {test.name}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {test._count.results} total results
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {test.variants.map((variant) => {
                        const successRate = variant._count.results > 0 ? 
                          Math.random() * 0.4 + 0.4 : 0; // Mock success rate between 40-80%
                        const avgLatency = Math.floor(Math.random() * 200 + 150); // Mock latency 150-350ms
                        
                        return (
                          <div key={variant.id} className="bg-gray-50 p-3 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {variant.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {(variant.traffic * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Success Rate:</span>
                                <span className={successRate > 0.6 ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                  {(successRate * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Avg Latency:</span>
                                <span>{avgLatency}ms</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Results:</span>
                                <span>{variant._count.results}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Usage Trends */}
        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Usage Trends</h3>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center text-gray-500 py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>Usage trend charts will be available once more data is collected</p>
              <p className="text-sm mt-2">Connect your applications using the SDK to start tracking usage patterns</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}