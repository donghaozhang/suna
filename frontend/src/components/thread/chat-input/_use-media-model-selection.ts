'use client';

import { useState, useEffect } from 'react';

export const STORAGE_KEY_MEDIA_MODEL = 'suna-preferred-media-model';
export const DEFAULT_MEDIA_MODEL_ID = 'fal-ai/flux/dev';

// Save media model preference to localStorage
const saveMediaModelPreference = (modelId: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_MEDIA_MODEL, modelId);
  }
};

// Load media model preference from localStorage
const loadMediaModelPreference = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_MEDIA_MODEL) || DEFAULT_MEDIA_MODEL_ID;
  }
  return DEFAULT_MEDIA_MODEL_ID;
};

export const useMediaModelSelection = () => {
  const [selectedMediaModel, setSelectedMediaModel] = useState<string>(DEFAULT_MEDIA_MODEL_ID);

  // Load saved model preference on mount
  useEffect(() => {
    const savedModel = loadMediaModelPreference();
    setSelectedMediaModel(savedModel);
  }, []);

  // Handle media model change
  const handleMediaModelChange = (modelId: string) => {
    setSelectedMediaModel(modelId);
    saveMediaModelPreference(modelId);
  };

  return {
    selectedMediaModel,
    handleMediaModelChange,
  };
}; 