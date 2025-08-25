import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon, PlusIcon, TrashIcon, BeakerIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import toast from 'react-hot-toast';

const variantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  promptId: z.string().min(1, 'Please select a prompt'),
  traffic: z.number().min(0.1, 'Traffic must be at least 10%').max(100, 'Traffic cannot exceed 100%'),
});

const abTestSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
  variants: z.array(variantSchema).min(2, 'At least 2 variants are required'),
});

type ABTestForm = z.infer<typeof abTestSchema>;
type VariantForm = z.infer<typeof variantSchema>;

export default function NewABTestPage() {
  const router = useRouter();
  const { project: projectParam } = router.query;

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.getProjects(),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ABTestForm>({
    resolver: zodResolver(abTestSchema),
    defaultValues: {
      projectId: (projectParam as string) || '',
      variants: [
        { name: 'Control', promptId: '', traffic: 50 },
        { name: 'Variant A', promptId: '', traffic: 50 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const selectedProjectId = watch('projectId');

  const { data: promptsData } = useQuery({
    queryKey: ['prompts', selectedProjectId],
    queryFn: () => apiClient.getPrompts(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const projects = projectsData?.projects || [];
  const prompts = promptsData?.prompts || [];
  const variants = watch('variants');

  // Auto-select first project if none selected
  React.useEffect(() => {
    if (projects.length > 0 && !watch('projectId')) {
      setValue('projectId', projects[0].id);
    }
  }, [projects, watch, setValue]);

  // Calculate total traffic allocation
  const totalTraffic = variants.reduce((sum, variant) => sum + (variant.traffic || 0), 0);

  const onSubmit = async (data: ABTestForm) => {
    // Validate traffic allocation
    if (Math.abs(totalTraffic - 100) > 0.1) {
      toast.error('Total traffic allocation must equal 100%');
      return;
    }

    // Convert traffic percentages to decimals
    const formattedVariants = data.variants.map(variant => ({
      ...variant,
      traffic: variant.traffic / 100,
    }));

    try {
      const response = await apiClient.createABTest({
        ...data,
        variants: formattedVariants,
      });

      toast.success('A/B test created successfully!');
      router.push('/dashboard/ab-tests');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const addVariant = () => {
    const remainingTraffic = Math.max(0, 100 - totalTraffic);
    append({
      name: `Variant ${String.fromCharCode(65 + fields.length - 1)}`,
      promptId: '',
      traffic: remainingTraffic,
    });
  };

  const redistributeTraffic = () => {
    const equalTraffic = Math.floor(100 / variants.length);
    const remainder = 100 - (equalTraffic * variants.length);

    variants.forEach((_, index) => {
      const traffic = equalTraffic + (index < remainder ? 1 : 0);
      // This would need form update logic
    });
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to A/B Tests
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Create New A/B Test</h1>
            <p className="mt-1 text-sm text-gray-500">
              Compare different prompts to optimize performance
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Test Name
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      className="form-input mt-1"
                      placeholder="e.g., welcome-message-test"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                      Project
                    </label>
                    <select {...register('projectId')} className="form-select mt-1">
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    {errors.projectId && (
                      <p className="mt-1 text-sm text-red-600">{errors.projectId.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    {...register('description')}
                    type="text"
                    className="form-input mt-1"
                    placeholder="Brief description of what you're testing"
                  />
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Variants</h3>
                  <div className="flex items-center space-x-2">
                    <div className={`text-sm px-3 py-1 rounded-full ${
                      Math.abs(totalTraffic - 100) < 0.1 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Total: {totalTraffic.toFixed(1)}%
                    </div>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="btn-outline btn-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Variant
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">
                          Variant {index + 1}
                        </h4>
                        {fields.length > 2 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Variant Name
                          </label>
                          <input
                            {...register(`variants.${index}.name`)}
                            type="text"
                            className="form-input mt-1"
                            placeholder="e.g., Control"
                          />
                          {errors.variants?.[index]?.name && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.variants[index]?.name?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Prompt
                          </label>
                          <select
                            {...register(`variants.${index}.promptId`)}
                            className="form-select mt-1"
                          >
                            <option value="">Select a prompt</option>
                            {prompts.map((prompt) => (
                              <option key={prompt.id} value={prompt.id}>
                                {prompt.name}
                              </option>
                            ))}
                          </select>
                          {errors.variants?.[index]?.promptId && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.variants[index]?.promptId?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Traffic %
                          </label>
                          <input
                            {...register(`variants.${index}.traffic`, { 
                              valueAsNumber: true 
                            })}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="form-input mt-1"
                            placeholder="50"
                          />
                          {errors.variants?.[index]?.traffic && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.variants[index]?.traffic?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Prompt Preview */}
                      {variants[index]?.promptId && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500 mb-1">Prompt Preview:</div>
                          <div className="text-sm text-gray-700">
                            {prompts.find(p => p.id === variants[index].promptId)?.content.substring(0, 100)}...
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {Math.abs(totalTraffic - 100) > 0.1 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <div className="text-yellow-800 text-sm">
                        <strong>Traffic allocation must total 100%.</strong> Current total: {totalTraffic.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                {errors.variants && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.variants.message}
                  </p>
                )}
              </div>
            </div>

            {/* Test Configuration */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Configuration</h3>
              </div>
              <div className="card-body">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <BeakerIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        How A/B Testing Works
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Users will be randomly assigned to variants based on traffic allocation</li>
                          <li>Each variant will serve its configured prompt</li>
                          <li>Performance metrics will be tracked automatically</li>
                          <li>You can monitor results in real-time from the test detail page</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || Math.abs(totalTraffic - 100) > 0.1}
                className="btn-primary"
              >
                {isSubmitting ? 'Creating...' : 'Create A/B Test'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}