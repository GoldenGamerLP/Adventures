import type { UserSummary } from "~~/shared/types/UserProfileTypes";

export const useUser = () => {
  //TODO: Eigenes Interface für Frontend User erstellen
  const user = useState<UserSummary & { mail: string } | null>("auth-user", () => null);
  return user;
};

export const hydrateUser = async () => {
  const user = useUser();
  const data = await useRequestFetch()("/api/v1/auth/user");
  user.value = data;
};
