import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  status: string;
}

interface TenantContextValue {
  tenant: TenantInfo | null;
  hostnameSlug: string | null;
  isRootDomain: boolean;
  setTenantContext: (tenant: TenantInfo) => void;
  clearTenantContext: () => void;
  redirectToDiscovery: (path?: string) => void;
  redirectToTenant: (slug: string, path?: string, contextData?: TenantInfo) => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

const TENANT_STORAGE_KEY = 'fitflow_tenant_context';
const TENANT_COOKIE_NAME = 'fitflow_tenant';

/**
 * Phân tích subdomain từ hostname hiện tại:
 * - yoyo.localhost:5173 -> "yoyo"
 * - yoyo.fitflow.io.vn -> "yoyo"
 * - localhost:5173 -> null
 * - 127.0.0.1:5173 -> null
 * - fitflow.io.vn -> null
 * - www.fitflow.io.vn -> null
 */
export function getTenantSlugFromHostname(): string | null {
  const hostname = window.location.hostname;
  if (!hostname) return null;

  // Localhost test pattern (e.g. yoyo.localhost)
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace(/\.localhost$/, '');
    if (sub && sub !== 'www' && sub !== 'api') return sub.toLowerCase();
    return null;
  }

  // Domain pattern (e.g. yoyo.fitflow.io.vn hoặc [sub].[domain].[tld])
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const sub = parts[0];
    if (sub && sub !== 'www' && sub !== 'api') return sub.toLowerCase();
  }

  return null;
}

/** Lấy root domain cho production (ví dụ fitfloww.store, fitflow.io.vn) */
export function getRootDomain(hostname: string): string | null {
  if (hostname.endsWith('.localhost') || hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    return null;
  }
  if (hostname.includes('fitfloww.store')) {
    return 'fitfloww.store';
  }
  if (hostname.includes('fitflow.io.vn')) {
    return 'fitflow.io.vn';
  }
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return null;
}

/** Xây dựng URL gốc cho Tenant Discovery (localhost:5173 hoặc fitfloww.store) */
export function buildDiscoveryUrl(path: string = '/owner/login'): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (hostname.endsWith('.localhost')) {
    return `${protocol}//localhost${port}${cleanPath}`;
  }

  const rootDomain = getRootDomain(hostname);
  if (rootDomain) {
    return `${protocol}//${rootDomain}${port}${cleanPath}`;
  }

  return `${protocol}//${hostname}${port}${cleanPath}`;
}

/** Xây dựng URL cho tenant cụ thể (yoyo.localhost:5173 hoặc yoyo.fitfloww.store) */
export function buildTenantUrl(slug: string, path: string = '/owner/login'): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const cleanSlug = slug.trim().toLowerCase();

  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return `${protocol}//${cleanSlug}.localhost${port}${cleanPath}`;
  }

  const rootDomain = getRootDomain(hostname);
  if (rootDomain) {
    return `${protocol}//${cleanSlug}.${rootDomain}${port}${cleanPath}`;
  }

  return `${protocol}//${cleanSlug}.${hostname}${cleanPath}`;
}

function setCookie(name: string, value: string, days: number = 7) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  const hostname = window.location.hostname;

  let domain = '';
  const rootDomain = getRootDomain(hostname);
  if (rootDomain) {
    domain = `; domain=.${rootDomain}`;
  }

  document.cookie = `${name}=${encodeURIComponent(value || '')}${expires}; path=/${domain}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}

function deleteCookie(name: string) {
  const hostname = window.location.hostname;
  let domain = '';
  const rootDomain = getRootDomain(hostname);
  if (rootDomain) {
    domain = `; domain=.${rootDomain}`;
  }
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;${domain}; SameSite=Lax`;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const hostnameSlug = useMemo(() => getTenantSlugFromHostname(), []);
  const isRootDomain = hostnameSlug === null;

  const [tenant, setTenant] = useState<TenantInfo | null>(() => {
    // 1. Kiểm tra URL query param `_tc` khi redirect từ Tenant Discovery
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tcParam = searchParams.get('_tc');
      if (tcParam) {
        const parsed = JSON.parse(decodeURIComponent(tcParam)) as TenantInfo;
        if (parsed && parsed.slug && (!hostnameSlug || parsed.slug === hostnameSlug)) {
          localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(parsed));
          setCookie(TENANT_COOKIE_NAME, JSON.stringify(parsed));

          // Dọn sạch `_tc` khỏi thanh địa chỉ URL mà không reload trang
          searchParams.delete('_tc');
          const newSearch = searchParams.toString();
          const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);

          return parsed;
        }
      }
    } catch {
      // bỏ qua nếu parsing lỗi
    }

    // 2. Kiểm tra localStorage
    try {
      const saved = localStorage.getItem(TENANT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TenantInfo;
        if (parsed && parsed.slug) {
          // Nếu đang ở subdomain, slug trong context PHẢI trùng với subdomain
          if (hostnameSlug && parsed.slug !== hostnameSlug) {
            return null;
          }
          return parsed;
        }
      }
    } catch {
      // bỏ qua
    }

    // 3. Kiểm tra Cookie
    try {
      const cookieVal = getCookie(TENANT_COOKIE_NAME);
      if (cookieVal) {
        const parsed = JSON.parse(cookieVal) as TenantInfo;
        if (parsed && parsed.slug) {
          if (hostnameSlug && parsed.slug !== hostnameSlug) {
            return null;
          }
          return parsed;
        }
      }
    } catch {
      // bỏ qua
    }

    return null;
  });

  const setTenantContext = useCallback((info: TenantInfo) => {
    setTenant(info);
    try {
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(info));
      setCookie(TENANT_COOKIE_NAME, JSON.stringify(info));
    } catch {
      // storage blocked
    }
  }, []);

  const clearTenantContext = useCallback(() => {
    setTenant(null);
    try {
      localStorage.removeItem(TENANT_STORAGE_KEY);
      deleteCookie(TENANT_COOKIE_NAME);
    } catch {
      // storage blocked
    }
  }, []);

  const redirectToDiscovery = useCallback(
    (path: string = '/owner/login') => {
      clearTenantContext();
      window.location.href = buildDiscoveryUrl(path);
    },
    [clearTenantContext]
  );

  const redirectToTenant = useCallback(
    (slug: string, path: string = '/owner/login', contextData?: TenantInfo) => {
      let targetUrl = buildTenantUrl(slug, path);
      if (contextData) {
        setTenantContext(contextData);
        const encoded = encodeURIComponent(JSON.stringify(contextData));
        targetUrl += `${targetUrl.includes('?') ? '&' : '?'}_tc=${encoded}`;
      }
      window.location.href = targetUrl;
    },
    [setTenantContext]
  );

  // Đồng bộ lại context nếu hostname thay đổi
  useEffect(() => {
    if (hostnameSlug && tenant && tenant.slug !== hostnameSlug) {
      clearTenantContext();
    }
  }, [hostnameSlug, tenant, clearTenantContext]);

  const value = useMemo(
    () => ({
      tenant,
      hostnameSlug,
      isRootDomain,
      setTenantContext,
      clearTenantContext,
      redirectToDiscovery,
      redirectToTenant,
    }),
    [
      tenant,
      hostnameSlug,
      isRootDomain,
      setTenantContext,
      clearTenantContext,
      redirectToDiscovery,
      redirectToTenant,
    ]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
