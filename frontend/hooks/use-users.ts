"use client";

import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/lib/api-context';
// This will be available after code generation
import { DefaultService } from '@/lib/api/services/DefaultService';
import { UserResponse } from '@/lib/api/models/UserResponse';

export function useUsers() {
  const { auth } = useApi();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    // Skip if not authenticated
    if (!auth.isAuthenticated) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // This path will need to be adjusted based on your actual API structure
      // after code generation
      const response = await DefaultService.usersGet();
      setUsers(response);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [auth.isAuthenticated]);

  // Load users on mount if authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchUsers();
    }
  }, [auth.isAuthenticated, fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
  };
}

// Example of a hook to get a single user
export function useUser(userId: string) {
  const { auth } = useApi();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    if (!auth.isAuthenticated || !userId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // This path will need to be adjusted based on your actual API structure
      // after code generation
      const response = await DefaultService.usersUserIdGet(userId);
      setUser(response);
    } catch (err) {
      console.error(`Error fetching user ${userId}:`, err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [auth.isAuthenticated, userId]);

  // Load user data on mount or when userId changes
  useEffect(() => {
    if (auth.isAuthenticated && userId) {
      fetchUser();
    }
  }, [auth.isAuthenticated, userId, fetchUser]);

  return {
    user,
    loading,
    error,
    fetchUser,
  };
} 