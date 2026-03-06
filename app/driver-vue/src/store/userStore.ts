// SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and e-mobility-driver-app contributors
// SPDX-License-Identifier: Apache-2.0

import { defineStore } from 'pinia';
import { ref } from 'vue';

import useAuthFetch from '@/composables/useAuthFetch.ts';

export const useUserStore = defineStore('user', () => {
  const firstName = ref('');
  const lastName = ref('');
  const email = ref('');
  const isAuthenticated = ref(false);

  async function fetchUser() {
    try {
      const res = await useAuthFetch(`${import.meta.env.VITE_BACKEND_URL}user-api/currentUser`);
      if (res.ok) {
        const data = await res.json();
        firstName.value = data.firstname || '';
        lastName.value = data.lastname || '';
        email.value = data.email || '';
        isAuthenticated.value = true;
      }
    } catch (_e) {
      clearUser();
    }
  }

  function login() {
    try {
      clearUser();
      window.location.replace('index.html');
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Login failed. Please try again.');
    }
  }

  function logout() {
    window.location.replace('logout');
    clearUser();
  }

  function clearUser() {
    firstName.value = '';
    lastName.value = '';
    email.value = '';
    isAuthenticated.value = false;
  }

  return {
    firstName,
    lastName,
    email,
    isAuthenticated,
    clearUser,
    fetchUser,
    login,
    logout,
  };
});
