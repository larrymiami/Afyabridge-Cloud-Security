export interface HouseholdRow {
  id: string;
  country: "KE" | "GH" | "ZA";
  programmeId: string;
  facilityId: string | null;
  assignmentId: string;
  displayName: string;
  createdBy: string;
  createdAt: Date;
}

export interface NewHouseholdRow {
  id: string;
  country: HouseholdRow["country"];
  programmeId: string;
  facilityId?: string;
  assignmentId: string;
  displayName: string;
  createdBy: string;
}
