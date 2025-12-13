import { useRef, useEffect } from 'react';

/**
 * @fileoverview A hook for managing ephemeral resources that require cleanup,
 * such as MediaStream tracks, object URLs, timers, or worker instances.
 */

// Must export these exact types and functions:
export type ResourceType = 'stream-track' | 'blob-url' | 'timer' | 'audio-node';

export interface ManagedResource {
  type: ResourceType;
  id: string;
  cleanup: () => void;
}

export interface UseResourceManagerReturn {
  register: (type: ResourceType, resource: unknown, cleanup: () => void) => string;
  unregister: (id: string) => void;
  cleanup: () => void;
  getResourceCount: () => number;
}

export const useResourceManager = (): UseResourceManagerReturn => {
  const resources = useRef<Map<string, ManagedResource>>(new Map());

  const register = (type: ResourceType, resource: unknown, cleanup: () => void): string => {
    const id = crypto.randomUUID();
    if (resource) { // Only store if resource is not null/undefined
        resources.current.set(id, { type, id, cleanup });
    }
    return id;
  };

  const unregister = (id: string) => {
    const resource = resources.current.get(id);
    if (resource) {
      try {
        resource.cleanup();
      } catch (e) {
        console.warn(`[useResourceManager] Cleanup failed for resource ${id}:`, e);
      }
      resources.current.delete(id);
    }
  };

  const cleanup = () => {
    const ids = Array.from(resources.current.keys());
    ids.forEach((id) => unregister(id));
  };
  
  const getResourceCount = () => resources.current.size;

  useEffect(() => {
    // Cleanup all resources on unmount
    return () => {
      cleanup();
    };
  }, []);

  return { register, unregister, cleanup, getResourceCount };
};
