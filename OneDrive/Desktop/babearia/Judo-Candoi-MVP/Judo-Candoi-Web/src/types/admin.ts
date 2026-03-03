export interface SiteSettingsAdminResponseDTO {
  id: number;
  brandName: string;
  heroTitle: string;
  heroSubtitle: string;
  impactPhrase: string;
  callToActionPrimaryLabel: string;
  callToActionPrimaryUrl: string;
  callToActionSecondaryLabel: string;
  aboutTitle: string;
  aboutStory: string;
  aboutHighlight: string;
  trialTitle: string;
  trialDescription: string;
  finalCallToAction: string;
  counterStudents: string;
  counterMedals: string;
  counterYears: string;
  medalCompetitions: number;
  medalFights: number;
  medalGold: number;
  medalSilver: number;
  medalBronze: number;
  whatsappNumber: string;
  instagramHandle: string;
  academyAddress: string;
  googleMapsEmbed: string;
}

export type SiteSettingsUpdateDTO = Omit<SiteSettingsAdminResponseDTO, "id">;

export interface BlogPostAdminResponseDTO {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  active: boolean;
  displayOrder: number;
}

export interface BlogPostUpsertDTO {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  active: boolean;
  displayOrder: number;
}

export interface AdminImageUploadResponseDTO {
  url: string;
  fileName: string;
  sizeInBytes: number;
}

export interface PrideStudentAdminResponseDTO {
  id: number;
  name: string;
  achievement: string;
  month: string;
  imageUrl?: string;
  active: boolean;
  displayOrder: number;
}

export interface PrideStudentUpsertDTO {
  name: string;
  achievement: string;
  month: string;
  imageUrl?: string;
  active: boolean;
  displayOrder: number;
}

export interface SponsorAdminResponseDTO {
  id: number;
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  active: boolean;
  displayOrder: number;
}

export interface SponsorUpsertDTO {
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  active: boolean;
  displayOrder: number;
}
