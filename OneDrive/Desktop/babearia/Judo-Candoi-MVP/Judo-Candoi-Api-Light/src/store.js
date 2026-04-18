import fs from "node:fs";
import path from "node:path";
import { createDefaultSiteSettings } from "./defaults.js";

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return structuredClone(value);
}

function sortByDisplayOrderAndId(a, b) {
  const byDisplayOrder = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);

  if (byDisplayOrder !== 0) {
    return byDisplayOrder;
  }

  return (a.id ?? 0) - (b.id ?? 0);
}

function createInitialState(config) {
  const timestamp = nowIso();

  return {
    counters: {
      siteSettings: 2,
      lead: 1,
      blogPost: 1,
      prideStudent: 1,
      sponsor: 1,
      image: 1
    },
    siteSettings: {
      id: 1,
      ...createDefaultSiteSettings(config),
      createdAt: timestamp,
      updatedAt: timestamp
    },
    leads: [],
    blogPosts: [],
    prideStudents: [],
    sponsors: [],
    uploadedImages: []
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function computeNextId(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 1;
  }

  let maxId = 0;

  for (const item of items) {
    const id = Number.parseInt(item?.id, 10);

    if (Number.isInteger(id) && id > maxId) {
      maxId = id;
    }
  }

  return maxId + 1;
}

function normalizeState(rawState, config) {
  const initialState = createInitialState(config);
  const parsed = rawState && typeof rawState === "object" ? rawState : {};

  const state = {
    counters: {
      ...initialState.counters,
      ...(parsed.counters && typeof parsed.counters === "object" ? parsed.counters : {})
    },
    siteSettings:
      parsed.siteSettings && typeof parsed.siteSettings === "object"
        ? parsed.siteSettings
        : initialState.siteSettings,
    leads: asArray(parsed.leads),
    blogPosts: asArray(parsed.blogPosts),
    prideStudents: asArray(parsed.prideStudents),
    sponsors: asArray(parsed.sponsors),
    uploadedImages: asArray(parsed.uploadedImages)
  };

  if (!state.siteSettings?.id) {
    state.siteSettings = initialState.siteSettings;
  }

  state.counters.lead = Math.max(
    Number.parseInt(state.counters.lead, 10) || 1,
    computeNextId(state.leads)
  );
  state.counters.blogPost = Math.max(
    Number.parseInt(state.counters.blogPost, 10) || 1,
    computeNextId(state.blogPosts)
  );
  state.counters.prideStudent = Math.max(
    Number.parseInt(state.counters.prideStudent, 10) || 1,
    computeNextId(state.prideStudents)
  );
  state.counters.sponsor = Math.max(
    Number.parseInt(state.counters.sponsor, 10) || 1,
    computeNextId(state.sponsors)
  );
  state.counters.image = Math.max(
    Number.parseInt(state.counters.image, 10) || 1,
    computeNextId(state.uploadedImages)
  );
  state.counters.siteSettings = Math.max(Number.parseInt(state.counters.siteSettings, 10) || 2, 2);

  return state;
}

export class JsonStore {
  constructor(config) {
    this.config = config;
    this.state = createInitialState(config);
  }

  load() {
    fs.mkdirSync(path.dirname(this.config.dbFilePath), { recursive: true });

    if (!fs.existsSync(this.config.dbFilePath)) {
      this.save();
      return;
    }

    const raw = fs.readFileSync(this.config.dbFilePath, "utf8");

    if (!raw.trim()) {
      this.state = createInitialState(this.config);
      this.save();
      return;
    }

    this.state = normalizeState(JSON.parse(raw), this.config);
    this.save();
  }

  save() {
    const tempPath = `${this.config.dbFilePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), "utf8");
    fs.renameSync(tempPath, this.config.dbFilePath);
  }

  nextId(counterName) {
    const current = Number.parseInt(this.state.counters[counterName], 10) || 1;
    this.state.counters[counterName] = current + 1;
    return current;
  }

  getSiteSettings() {
    return clone(this.state.siteSettings);
  }

  updateSiteSettings(patch) {
    const current = this.state.siteSettings;
    const next = {
      ...current,
      ...patch,
      id: current.id,
      updatedAt: nowIso()
    };

    this.state.siteSettings = next;
    this.save();

    return clone(next);
  }

  createLead(payload) {
    const record = {
      id: this.nextId("lead"),
      name: payload.name,
      age: payload.age,
      phone: payload.phone,
      objective: payload.objective,
      createdAt: nowIso()
    };

    this.state.leads.push(record);
    this.save();

    return clone(record);
  }

  listLeads() {
    const items = [...this.state.leads].sort((a, b) => {
      const aTime = Date.parse(a.createdAt ?? "");
      const bTime = Date.parse(b.createdAt ?? "");
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });

    return clone(items);
  }

  listBlogPosts() {
    return clone([...this.state.blogPosts].sort(sortByDisplayOrderAndId));
  }

  findBlogPostById(id) {
    const found = this.state.blogPosts.find((post) => post.id === id);
    return found ? clone(found) : null;
  }

  hasBlogSlug(slug, excludedId = null) {
    return this.state.blogPosts.some((post) => post.slug === slug && post.id !== excludedId);
  }

  createBlogPost(payload) {
    const timestamp = nowIso();
    const record = {
      id: this.nextId("blogPost"),
      ...payload,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.state.blogPosts.push(record);
    this.save();

    return clone(record);
  }

  updateBlogPost(id, payload) {
    const index = this.state.blogPosts.findIndex((post) => post.id === id);

    if (index < 0) {
      return null;
    }

    const current = this.state.blogPosts[index];
    const updated = {
      ...current,
      ...payload,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: nowIso()
    };

    this.state.blogPosts[index] = updated;
    this.save();

    return clone(updated);
  }

  deleteBlogPost(id) {
    const index = this.state.blogPosts.findIndex((post) => post.id === id);

    if (index < 0) {
      return false;
    }

    this.state.blogPosts.splice(index, 1);
    this.save();

    return true;
  }

  listPrideStudents() {
    return clone([...this.state.prideStudents].sort(sortByDisplayOrderAndId));
  }

  findPrideStudentById(id) {
    const found = this.state.prideStudents.find((student) => student.id === id);
    return found ? clone(found) : null;
  }

  createPrideStudent(payload) {
    const timestamp = nowIso();
    const record = {
      id: this.nextId("prideStudent"),
      ...payload,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.state.prideStudents.push(record);
    this.save();

    return clone(record);
  }

  updatePrideStudent(id, payload) {
    const index = this.state.prideStudents.findIndex((student) => student.id === id);

    if (index < 0) {
      return null;
    }

    const current = this.state.prideStudents[index];
    const updated = {
      ...current,
      ...payload,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: nowIso()
    };

    this.state.prideStudents[index] = updated;
    this.save();

    return clone(updated);
  }

  deletePrideStudent(id) {
    const index = this.state.prideStudents.findIndex((student) => student.id === id);

    if (index < 0) {
      return false;
    }

    this.state.prideStudents.splice(index, 1);
    this.save();

    return true;
  }

  listSponsors() {
    return clone([...this.state.sponsors].sort(sortByDisplayOrderAndId));
  }

  findSponsorById(id) {
    const found = this.state.sponsors.find((sponsor) => sponsor.id === id);
    return found ? clone(found) : null;
  }

  createSponsor(payload) {
    const timestamp = nowIso();
    const record = {
      id: this.nextId("sponsor"),
      ...payload,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.state.sponsors.push(record);
    this.save();

    return clone(record);
  }

  updateSponsor(id, payload) {
    const index = this.state.sponsors.findIndex((sponsor) => sponsor.id === id);

    if (index < 0) {
      return null;
    }

    const current = this.state.sponsors[index];
    const updated = {
      ...current,
      ...payload,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: nowIso()
    };

    this.state.sponsors[index] = updated;
    this.save();

    return clone(updated);
  }

  deleteSponsor(id) {
    const index = this.state.sponsors.findIndex((sponsor) => sponsor.id === id);

    if (index < 0) {
      return false;
    }

    this.state.sponsors.splice(index, 1);
    this.save();

    return true;
  }

  createUploadedImage(payload) {
    const record = {
      id: this.nextId("image"),
      ...payload,
      createdAt: nowIso()
    };

    this.state.uploadedImages.push(record);
    this.save();

    return clone(record);
  }

  findUploadedImageById(id) {
    const found = this.state.uploadedImages.find((image) => image.id === id);
    return found ? clone(found) : null;
  }
}
