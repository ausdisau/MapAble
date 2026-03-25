import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

type SafeUser = Omit<User, "password"> & { auth0Login?: boolean };

export function useAuth() {
  const { data: user, isLoading } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to check auth");
      return res.json();
    },
    staleTime: Infinity,
    retry: false,
  });

  const { data: auth0Config } = useQuery<{ enabled: boolean; domain: string | null }>({
    queryKey: ["/api/auth/auth0/config"],
    queryFn: async () => {
      const res = await fetch("/api/auth/auth0/config");
      if (!res.ok) return { enabled: false, domain: null };
      return res.json();
    },
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return res.json() as Promise<SafeUser>;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const isAuth0Session = !!user?.auth0Login;

      if (isAuth0Session) {
        const res = await apiRequest("POST", "/api/auth/auth0/logout");
        const data = await res.json();
        queryClient.setQueryData(["/api/auth/me"], null);
        queryClient.clear();
        if (data.auth0LogoutUrl) {
          window.location.href = data.auth0LogoutUrl;
          return;
        }
      } else {
        await apiRequest("POST", "/api/auth/logout");
        queryClient.setQueryData(["/api/auth/me"], null);
        queryClient.clear();
      }
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    auth0Enabled: auth0Config?.enabled ?? false,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}
