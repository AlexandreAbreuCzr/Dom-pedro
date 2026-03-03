export interface CounterDTO {
  label: string;
  value: string;
}

export interface MedalStatsDTO {
  competitions: number;
  fights: number;
  gold: number;
  silver: number;
  bronze: number;
}

export interface ProgramDTO {
  title: string;
  ageRange: string;
  highlights: string[];
  ctaText: string;
}

export interface AchievementDTO {
  title: string;
  description: string;
}

export interface GalleryItemDTO {
  title: string;
  imageUrl: string;
  category: string;
}

export interface TestimonialDTO {
  quote: string;
  author: string;
  role: string;
}

export interface ScheduleItemDTO {
  day: string;
  time: string;
  audience: string;
  level: string;
}

export interface BlogPostDTO {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
}

export interface SponsorDTO {
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
}

export interface TimelineStepDTO {
  title: string;
  description: string;
}

export interface PrideStudentDTO {
  name: string;
  achievement: string;
  month: string;
  imageUrl?: string;
}

export interface ContactDTO {
  address: string;
  whatsappUrl: string;
  whatsappLabel: string;
  instagramHandle: string;
  instagramUrl: string;
  mapEmbedUrl: string;
}

export interface SiteContentResponseDTO {
  brandName: string;
  heroTitle: string;
  heroSubtitle: string;
  impactPhrase: string;
  callToActionPrimaryLabel: string;
  callToActionPrimaryUrl: string;
  callToActionSecondaryLabel: string;
  callToActionSecondaryUrl: string;
  aboutTitle: string;
  aboutStory: string;
  aboutHighlight: string;
  counters: CounterDTO[];
  medalStats: MedalStatsDTO;
  programs: ProgramDTO[];
  methodology: string[];
  achievements: AchievementDTO[];
  gallery: GalleryItemDTO[];
  testimonials: TestimonialDTO[];
  trialTitle: string;
  trialDescription: string;
  schedules: ScheduleItemDTO[];
  blogPosts: BlogPostDTO[];
  sponsors: SponsorDTO[];
  timeline: TimelineStepDTO[];
  prideStudents: PrideStudentDTO[];
  contact: ContactDTO;
  finalCallToAction: string;
}

export interface ExperimentalClassLeadRequestDTO {
  name: string;
  age: number;
  phone: string;
  objective?: string;
}

export interface ExperimentalClassLeadResponseDTO {
  id: number;
  name: string;
  age: number;
  phone: string;
  objective: string;
  createdAt: string;
  message: string;
}
