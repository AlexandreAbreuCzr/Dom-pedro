import {
  DEFAULT_WHATSAPP_MESSAGE,
  STATIC_ACHIEVEMENTS,
  STATIC_GALLERY,
  STATIC_METHODOLOGY,
  STATIC_PROGRAMS,
  STATIC_SCHEDULES,
  STATIC_TESTIMONIALS,
  STATIC_TIMELINE
} from "./defaults.js";

function normalizeBlogPost(post) {
  const excerpt = typeof post.excerpt === "string" ? post.excerpt : "";
  const content = typeof post.content === "string" && post.content.trim().length > 0 ? post.content : excerpt;
  const imageUrl = typeof post.imageUrl === "string" && post.imageUrl.trim().length > 0 ? post.imageUrl : null;

  return {
    title: post.title,
    slug: post.slug,
    excerpt,
    content,
    imageUrl
  };
}

function normalizeSponsor(sponsor) {
  return {
    name: sponsor.name,
    description: sponsor.description,
    logoUrl: sponsor.logoUrl,
    websiteUrl: sponsor.websiteUrl
  };
}

function normalizePrideStudent(student) {
  return {
    name: student.name,
    achievement: student.achievement,
    month: student.month,
    imageUrl: student.imageUrl
  };
}

export function buildSiteContent(settings, blogPosts, sponsors, prideStudents) {
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    DEFAULT_WHATSAPP_MESSAGE
  )}`;
  const instagramUserWithoutAt = settings.instagramHandle.replaceAll("@", "");

  return {
    brandName: settings.brandName,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    impactPhrase: settings.impactPhrase,
    callToActionPrimaryLabel: settings.callToActionPrimaryLabel,
    callToActionPrimaryUrl: settings.callToActionPrimaryUrl,
    callToActionSecondaryLabel: settings.callToActionSecondaryLabel,
    callToActionSecondaryUrl: whatsappUrl,
    aboutTitle: settings.aboutTitle,
    aboutStory: settings.aboutStory,
    aboutHighlight: settings.aboutHighlight,
    counters: [
      { label: "alunos ativos", value: settings.counterStudents },
      { label: "medalhas conquistadas", value: settings.counterMedals },
      { label: "anos formando atletas", value: settings.counterYears }
    ],
    medalStats: {
      competitions: settings.medalCompetitions,
      fights: settings.medalFights,
      gold: settings.medalGold,
      silver: settings.medalSilver,
      bronze: settings.medalBronze
    },
    programs: STATIC_PROGRAMS,
    methodology: STATIC_METHODOLOGY,
    achievements: STATIC_ACHIEVEMENTS,
    gallery: STATIC_GALLERY,
    testimonials: STATIC_TESTIMONIALS,
    trialTitle: settings.trialTitle,
    trialDescription: settings.trialDescription,
    schedules: STATIC_SCHEDULES,
    blogPosts: blogPosts.map(normalizeBlogPost),
    sponsors: sponsors.map(normalizeSponsor),
    timeline: STATIC_TIMELINE,
    prideStudents: prideStudents.map(normalizePrideStudent),
    contact: {
      address: settings.academyAddress,
      whatsappUrl,
      whatsappLabel: "WhatsApp direto",
      instagramHandle: settings.instagramHandle,
      instagramUrl: `https://instagram.com/${instagramUserWithoutAt}`,
      mapEmbedUrl: settings.googleMapsEmbed
    },
    finalCallToAction: settings.finalCallToAction
  };
}
