function secureFlags(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return '; Secure; SameSite=None';
  }
  return '';
}

export function setTokenCookies(access: string, refresh: string) {
  const flags = secureFlags();
  document.cookie = `access_token=${access}; path=/; max-age=900${flags}`;
  document.cookie = `refresh_token=${refresh}; path=/; max-age=604800${flags}`;
}

export function clearTokenCookies() {
  document.cookie = 'access_token=; path=/; max-age=0';
  document.cookie = 'refresh_token=; path=/; max-age=0';
}
