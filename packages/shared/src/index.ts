export const countryCodes = ["KE", "GH", "ZA"] as const;

export type CountryCode = (typeof countryCodes)[number];

export type CountryScopedId = `${CountryCode}_${string}`;

export interface RequestScope {
  country: CountryCode;
  programmeId: CountryScopedId;
  facilityId?: CountryScopedId;
  assignmentIds: readonly CountryScopedId[];
}

export interface AuthenticatedActor {
  actorId: string;
  actorType: "workforce" | "workload";
  roles: readonly string[];
  scope: RequestScope;
}

export function isCountryScopedId(
  value: string,
  country: CountryCode
): value is CountryScopedId {
  return value.startsWith(`${country}_`);
}
