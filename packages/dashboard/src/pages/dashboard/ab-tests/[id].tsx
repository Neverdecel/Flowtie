import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import toast from 'react-hot-toast';

export default function ABTestDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();

  const { data: abTestData, isLoading } = useQuery({
    queryKey: ['ab-test', id],
    queryFn: () => apiClient.getABTest(id as string),
    enabled: !!id,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['ab-test-analytics', id],
    queryFn: () => apiClient.getABTestAnalytics(id as string),
    enabled: !!id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => apiClient.updateABTest(id as string, { status }),
    onSuccess: () => {
      toast.success('A/B test status updated!');
      queryClient.invalidateQueries({ queryKey: ['ab-test', id] });
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const abTest = abTestData?.abTest;
  const analytics = analyticsData?.analytics || [];

  const handleStatusChange = async (newStatus: string) => {
    let confirmMessage = '';
    switch (newStatus) {
      case 'ACTIVE':
        confirmMessage = abTest?.status === 'PAUSED' 
          ? 'Resume this A/B test?' 
          : 'Start this A/B test?';
        break;
      case 'PAUSED':
        confirmMessage = 'Pause this A/B test? You can resume it later.';
        break;
      case 'COMPLETED':
        confirmMessage = 'Stop this A/B test? This action cannot be undone.';
        break;
    }

    if (confirm(confirmMessage)) {
      updateStatusMutation.mutate(newStatus);
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

  // Calculate winner (variant with highest success rate)
  const winner = analytics.length > 0 
    ? analytics.reduce((prev, current) => 
        prev.successRate > current.successRate ? prev : current
      )
    : null;

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading A/B test...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!abTest) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-500">A/B test not found</p>
            <button
              onClick={() => router.push('/dashboard/ab-tests')}
              className="mt-4 btn-primary"
            >
              Back to A/B Tests
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard/ab-tests')}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to A/B Tests
            </button>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900">{abTest.name}</h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(abTest.status)}`}>
                    {getStatusIcon(abTest.status)}
                    <span className="ml-1">{abTest.status}</span>
                  </span>
                </div>
                <p className="mt-1 text-lg text-gray-500">
                  {abTest.description || 'No description provided'}
                </p>
              </div>

              {/* Status Controls */}
              <div className="flex space-x-2">
                {abTest.status === 'DRAFT' && (
                  <button
                    onClick={() => handleStatusChange('ACTIVE')}
                    disabled={updateStatusMutation.isPending}
                    className="btn-primary"
                  >
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Start Test
                  </button>
                )}
                
                {abTest.status === 'ACTIVE' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('PAUSED')}
                      disabled={updateStatusMutation.isPending}
                      className="btn-outline text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                    >
                      <PauseIcon className="h-4 w-4 mr-1" />
                      Pause
                    </button>
                    <button
                      onClick={() => handleStatusChange('COMPLETED')}
                      disabled={updateStatusMutation.isPending}
                      className="btn-outline text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <StopIcon className="h-4 w-4 mr-1" />
                      Stop
                    </button>
                  </>
                )}

                {abTest.status === 'PAUSED' && (
                  <button
                    onClick={() => handleStatusChange('ACTIVE')}
                    disabled={updateStatusMutation.isPending}
                    className="btn-primary"
                  >
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Resume
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Tests</p>
                  <p className="text-2xl font-semibold text-gray-900">{abTest._count.results}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Response</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.length > 0 
                      ? `${Math.round(analytics.reduce((sum, a) => sum + a.avgLatency, 0) / analytics.length)}ms`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Success Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analytics.length > 0 
                      ? `${(analytics.reduce((sum, a) => sum + a.successRate, 0) / analytics.length * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <BeakerIcon className="h-8 w-8 text-primary-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Variants</p>
                  <p className="text-2xl font-semibold text-gray-900">{abTest.variants.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Winner Announcement */}
          {winner && abTest.status === 'COMPLETED' && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-green-900">
                    Winner: {winner.variantName}
                  </h3>
                  <p className="text-green-700">
                    This variant achieved the highest success rate of {(winner.successRate * 100).toFixed(1)}% 
                    with an average response time of {Math.round(winner.avgLatency)}ms.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Variants Performance */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Variant Performance</h3>
            </div>
            <div className="p-0">
              {abTest.variants.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No variants configured
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-0">
                  {abTest.variants.map((variant, index) => {
                    const variantAnalytics = analytics.find(a => a.variantName === variant.name);
                    const isWinner = winner && winner.variantName === variant.name;
                    
                    return (
                      <div 
                        key={variant.id} 
                        className={`p-6 border-b border-gray-200 last:border-b-0 ${
                          isWinner ? 'bg-green-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900">
                              {variant.name}
                              {isWinner && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Winner
                                </span>
                              )}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {(variant.traffic * 100).toFixed(0)}% traffic
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Results</p>
                            <p className="text-xl font-semibold text-gray-900">
                              {variantAnalytics?.totalResults || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Success Rate</p>
                            <p className="text-xl font-semibold text-gray-900">
                              {variantAnalytics 
                                ? `${(variantAnalytics.successRate * 100).toFixed(1)}%`
                                : 'N/A'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Avg Latency</p>
                            <p className="text-xl font-semibold text-gray-900">
                              {variantAnalytics 
                                ? `${Math.round(variantAnalytics.avgLatency)}ms`
                                : 'N/A'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Conversion</p>
                            <p className="text-xl font-semibold text-gray-900">
                              {variantAnalytics 
                                ? `${((variantAnalytics.successRate * variantAnalytics.totalResults) / (abTest._count.results || 1) * 100).toFixed(1)}%`
                                : 'N/A'
                              }
                            </p>
                          </div>
                        </div>

                        {/* Traffic visualization */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                            <span>Traffic Allocation</span>
                            <span>{(variant.traffic * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${isWinner ? 'bg-green-600' : 'bg-primary-600'}`}
                              style={{ width: `${variant.traffic * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Test Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Test Information</h3>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Test ID</dt>
                  <dd className="text-sm font-mono text-gray-900">{abTest.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Project</dt>
                  <dd className="text-sm text-gray-900">{abTest.project?.name || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(abTest.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(abTest.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
                {abTest.status === 'ACTIVE' && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                        Test is running and collecting data
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}