import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon, EyeIcon, CodeBracketIcon, TrashIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import { apiClient } from '@/utils/api';
import toast from 'react-hot-toast';

const promptSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

type PromptForm = z.infer<typeof promptSchema>;

export default function PromptEditPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [previewMode, setPreviewMode] = useState(false);

  const { data: promptData, isLoading } = useQuery({
    queryKey: ['prompt', id],
    queryFn: () => apiClient.getPrompt(id as string),
    enabled: !!id,
  });

  const updatePromptMutation = useMutation({
    mutationFn: (data: PromptForm) => apiClient.updatePrompt(id as string, { ...data, variables }),
    onSuccess: () => {
      toast.success('Prompt updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['prompt', id] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: () => apiClient.deletePrompt(id as string),
    onSuccess: () => {
      toast.success('Prompt deleted successfully!');
      router.push('/dashboard/prompts');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PromptForm>({
    resolver: zodResolver(promptSchema),
  });

  const prompt = promptData?.prompt;
  const content = watch('content') || '';

  // Initialize form when prompt data loads
  React.useEffect(() => {
    if (prompt) {
      reset({
        name: prompt.name,
        description: prompt.description || '',
        content: prompt.content,
        status: prompt.status,
      });
      setVariables(prompt.variables || {});
    }
  }, [prompt, reset]);

  // Extract variables from content
  const extractedVariables = (content.match(/\{\{(\w+)\}\}/g) || [])
    .map(match => match.replace(/[{}]/g, ''))
    .filter((value, index, self) => self.indexOf(value) === index);

  // Auto-populate variables object when template variables are detected
  React.useEffect(() => {
    const newVariables: Record<string, any> = {};
    extractedVariables.forEach(varName => {
      if (!(varName in variables)) {
        newVariables[varName] = '';
      }
    });
    if (Object.keys(newVariables).length > 0) {
      setVariables(prev => ({ ...prev, ...newVariables }));
    }
  }, [extractedVariables]);

  const interpolateContent = (template: string, vars: Record<string, any>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return vars[key] !== undefined ? String(vars[key]) : match;
    });
  };

  const onSubmit = async (data: PromptForm) => {
    updatePromptMutation.mutate(data);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      return;
    }
    deletePromptMutation.mutate();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading prompt...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!prompt) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-500">Prompt not found</p>
            <button
              onClick={() => router.push('/dashboard/prompts')}
              className="mt-4 btn-primary"
            >
              Back to Prompts
            </button>
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
            <button
              onClick={() => router.back()}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Prompts
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Prompt</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Modify your AI prompt and test with template variables
                </p>
              </div>
              <button
                onClick={handleDelete}
                disabled={deletePromptMutation.isPending}
                className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                {deletePromptMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
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
                      Prompt Name
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      className="form-input mt-1"
                      placeholder="e.g., welcome-message"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select {...register('status')} className="form-select mt-1">
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
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
                    placeholder="Brief description of what this prompt does"
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Prompt Content</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setPreviewMode(!previewMode)}
                      className={`flex items-center px-3 py-1 rounded-md text-sm ${
                        previewMode 
                          ? 'bg-primary-100 text-primary-800' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {previewMode ? (
                        <>
                          <CodeBracketIcon className="h-4 w-4 mr-1" />
                          Edit
                        </>
                      ) : (
                        <>
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Preview
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {!previewMode ? (
                  <div>
                    <textarea
                      {...register('content')}
                      rows={8}
                      className="form-textarea"
                      placeholder="Enter your prompt content here. Use {{variableName}} for template variables.&#10;&#10;Example:&#10;Hello {{userName}}, welcome to {{companyName}}!"
                    />
                    {errors.content && (
                      <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                    )}
                    
                    {extractedVariables.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          Template variables detected:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {extractedVariables.map((varName) => (
                            <span
                              key={varName}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {varName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="bg-gray-50 border rounded-md p-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
                      <div className="whitespace-pre-wrap text-sm text-gray-900">
                        {interpolateContent(content, variables)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Variables */}
            {extractedVariables.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">Template Variables</h3>
                  <p className="text-sm text-gray-500">
                    Set default values for your template variables
                  </p>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {extractedVariables.map((varName) => (
                      <div key={varName}>
                        <label className="block text-sm font-medium text-gray-700">
                          {varName}
                        </label>
                        <input
                          type="text"
                          value={variables[varName] || ''}
                          onChange={(e) => setVariables(prev => ({ 
                            ...prev, 
                            [varName]: e.target.value 
                          }))}
                          className="form-input mt-1"
                          placeholder={`Default value for ${varName}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Prompt Metadata */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Metadata</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Version</dt>
                    <dd className="text-sm text-gray-900">v{prompt.version}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Usage Count</dt>
                    <dd className="text-sm text-gray-900">{prompt._count?.usageLogs || 0} times</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(prompt.updatedAt).toLocaleDateString()}
                    </dd>
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
                disabled={isSubmitting || updatePromptMutation.isPending}
                className="btn-primary"
              >
                {isSubmitting || updatePromptMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}