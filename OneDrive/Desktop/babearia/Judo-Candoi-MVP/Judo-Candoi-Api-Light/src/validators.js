import { badRequest } from "./errors.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{8,20}$/;

const DEFAULT_OBJECTIVE = "Aula experimental";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toTrimmedString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function addError(errors, field, message) {
  if (!(field in errors)) {
    errors[field] = message;
  }
}

function validateRequiredText(errors, payload, field, requiredMessage, maxLength, maxLengthMessage) {
  const value = payload[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    addError(errors, field, requiredMessage);
    return;
  }

  if (value.trim().length > maxLength) {
    addError(errors, field, maxLengthMessage);
  }
}

function validateOptionalText(errors, payload, field, maxLength, maxLengthMessage) {
  const value = payload[field];

  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "string") {
    addError(errors, field, `Campo ${field} invalido`);
    return;
  }

  if (value.trim().length > maxLength) {
    addError(errors, field, maxLengthMessage);
  }
}

function normalizeActive(active) {
  return active === undefined || active === null ? true : Boolean(active);
}

function normalizeDisplayOrder(value) {
  if (value === undefined || value === null) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function throwValidationIfNeeded(errors) {
  if (Object.keys(errors).length > 0) {
    throw badRequest("Falha de validacao dos dados enviados.", errors);
  }
}

function validateIntegerField(errors, payload, field, requiredMessage, minValue, minMessage) {
  const value = payload[field];

  if (value === undefined || value === null) {
    addError(errors, field, requiredMessage);
    return;
  }

  if (!Number.isInteger(value) || value < minValue) {
    addError(errors, field, minMessage);
  }
}

function validateOptionalBoolean(errors, payload, field) {
  const value = payload[field];

  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "boolean") {
    addError(errors, field, `Campo ${field} invalido`);
  }
}

function validateOptionalInteger(errors, payload, field) {
  const value = payload[field];

  if (value === undefined || value === null) {
    return;
  }

  if (!Number.isInteger(value)) {
    addError(errors, field, `Campo ${field} invalido`);
  }
}

function assertPayloadObject(payload) {
  if (!isObject(payload)) {
    throw badRequest("Corpo da requisicao invalido.", "JSON invalido");
  }
}

export function parsePositiveId(rawId) {
  const parsed = Number.parseInt(rawId, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest("Parametros invalidos na requisicao.", "id deve ser um inteiro positivo");
  }

  return parsed;
}

export function validateLeadCreatePayload(payload) {
  assertPayloadObject(payload);

  const errors = {};

  if (typeof payload.name !== "string" || payload.name.trim().length === 0) {
    addError(errors, "name", "Nome e obrigatorio");
  } else if (payload.name.trim().length < 2 || payload.name.trim().length > 120) {
    addError(errors, "name", "Nome deve ter entre 2 e 120 caracteres");
  }

  if (payload.age === undefined || payload.age === null) {
    addError(errors, "age", "Idade e obrigatoria");
  } else if (!Number.isInteger(payload.age) || payload.age < 4) {
    addError(errors, "age", "Idade minima permitida e 4 anos");
  } else if (payload.age > 80) {
    addError(errors, "age", "Idade maxima permitida e 80 anos");
  }

  if (typeof payload.phone !== "string" || payload.phone.trim().length === 0) {
    addError(errors, "phone", "Telefone/WhatsApp e obrigatorio");
  } else if (!PHONE_PATTERN.test(payload.phone.trim())) {
    addError(errors, "phone", "Telefone/WhatsApp invalido");
  }

  if (payload.objective !== undefined && payload.objective !== null) {
    if (typeof payload.objective !== "string") {
      addError(errors, "objective", "Campo objective invalido");
    } else if (payload.objective.trim().length > 250) {
      addError(errors, "objective", "Objetivo deve ter no maximo 250 caracteres");
    }
  }

  throwValidationIfNeeded(errors);

  const objective = toTrimmedString(payload.objective);

  return {
    name: payload.name.trim(),
    age: payload.age,
    phone: payload.phone.trim(),
    objective: objective.length > 0 ? objective : DEFAULT_OBJECTIVE
  };
}

export function validateBlogPostUpsertPayload(payload) {
  assertPayloadObject(payload);

  const errors = {};

  validateRequiredText(
    errors,
    payload,
    "title",
    "Titulo e obrigatorio",
    140,
    "Titulo deve ter no maximo 140 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "slug",
    "Slug e obrigatorio",
    160,
    "Slug deve ter no maximo 160 caracteres"
  );

  if (typeof payload.slug === "string" && payload.slug.trim().length > 0) {
    if (!SLUG_PATTERN.test(payload.slug.trim())) {
      addError(errors, "slug", "Slug deve seguir o formato texto-com-hifen");
    }
  }

  validateRequiredText(
    errors,
    payload,
    "excerpt",
    "Resumo e obrigatorio",
    400,
    "Resumo deve ter no maximo 400 caracteres"
  );
  validateOptionalText(
    errors,
    payload,
    "content",
    12000,
    "Conteudo deve ter no maximo 12000 caracteres"
  );
  validateOptionalText(
    errors,
    payload,
    "imageUrl",
    2000,
    "URL da imagem deve ter no maximo 2000 caracteres"
  );
  validateOptionalBoolean(errors, payload, "active");
  validateOptionalInteger(errors, payload, "displayOrder");

  throwValidationIfNeeded(errors);

  const excerpt = payload.excerpt.trim();
  const rawContent = payload.content;
  const normalizedContent =
    typeof rawContent !== "string" || rawContent.trim().length === 0 ? excerpt : rawContent.trim();
  const imageUrl =
    typeof payload.imageUrl !== "string" || payload.imageUrl.trim().length === 0
      ? null
      : payload.imageUrl.trim();

  return {
    title: payload.title.trim(),
    slug: payload.slug.trim(),
    excerpt,
    content: normalizedContent,
    imageUrl,
    active: normalizeActive(payload.active),
    displayOrder: normalizeDisplayOrder(payload.displayOrder)
  };
}

export function validatePrideStudentUpsertPayload(payload) {
  assertPayloadObject(payload);

  const errors = {};

  validateRequiredText(
    errors,
    payload,
    "name",
    "Nome e obrigatorio",
    120,
    "Nome deve ter no maximo 120 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "achievement",
    "Conquista e obrigatoria",
    260,
    "Conquista deve ter no maximo 260 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "month",
    "Mes e obrigatorio",
    40,
    "Mes deve ter no maximo 40 caracteres"
  );
  validateOptionalText(
    errors,
    payload,
    "imageUrl",
    500,
    "URL da imagem deve ter no maximo 500 caracteres"
  );
  validateOptionalBoolean(errors, payload, "active");
  validateOptionalInteger(errors, payload, "displayOrder");

  throwValidationIfNeeded(errors);

  const imageUrl =
    typeof payload.imageUrl !== "string" || payload.imageUrl.trim().length === 0
      ? null
      : payload.imageUrl.trim();

  return {
    name: payload.name.trim(),
    achievement: payload.achievement.trim(),
    month: payload.month.trim(),
    imageUrl,
    active: normalizeActive(payload.active),
    displayOrder: normalizeDisplayOrder(payload.displayOrder)
  };
}

export function validateSponsorUpsertPayload(payload) {
  assertPayloadObject(payload);

  const errors = {};

  validateRequiredText(
    errors,
    payload,
    "name",
    "Nome do patrocinador e obrigatorio",
    120,
    "Nome deve ter no maximo 120 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "description",
    "Descricao e obrigatoria",
    1000,
    "Descricao deve ter no maximo 1000 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "logoUrl",
    "URL da logo e obrigatoria",
    2000,
    "URL da logo deve ter no maximo 2000 caracteres"
  );
  validateOptionalText(
    errors,
    payload,
    "websiteUrl",
    2000,
    "URL do site deve ter no maximo 2000 caracteres"
  );
  validateOptionalBoolean(errors, payload, "active");
  validateOptionalInteger(errors, payload, "displayOrder");

  throwValidationIfNeeded(errors);

  const websiteUrl =
    typeof payload.websiteUrl !== "string" || payload.websiteUrl.trim().length === 0
      ? ""
      : payload.websiteUrl.trim();

  return {
    name: payload.name.trim(),
    description: payload.description.trim(),
    logoUrl: payload.logoUrl.trim(),
    websiteUrl,
    active: normalizeActive(payload.active),
    displayOrder: normalizeDisplayOrder(payload.displayOrder)
  };
}

export function validateSiteSettingsUpdatePayload(payload) {
  assertPayloadObject(payload);

  const errors = {};

  validateRequiredText(
    errors,
    payload,
    "brandName",
    "Marca e obrigatoria",
    120,
    "Marca deve ter no maximo 120 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "heroTitle",
    "Titulo principal e obrigatorio",
    200,
    "Titulo principal deve ter no maximo 200 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "heroSubtitle",
    "Subtitulo principal e obrigatorio",
    500,
    "Subtitulo principal deve ter no maximo 500 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "impactPhrase",
    "Frase de impacto e obrigatoria",
    260,
    "Frase de impacto deve ter no maximo 260 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "callToActionPrimaryLabel",
    "Texto do botao principal e obrigatorio",
    80,
    "Texto do botao principal deve ter no maximo 80 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "callToActionPrimaryUrl",
    "Link do botao principal e obrigatorio",
    180,
    "Link do botao principal deve ter no maximo 180 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "callToActionSecondaryLabel",
    "Texto do botao secundario e obrigatorio",
    80,
    "Texto do botao secundario deve ter no maximo 80 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "aboutTitle",
    "Titulo da secao sobre e obrigatorio",
    120,
    "Titulo da secao sobre deve ter no maximo 120 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "aboutStory",
    "Historia da academia e obrigatoria",
    1200,
    "Historia da academia deve ter no maximo 1200 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "aboutHighlight",
    "Destaque da secao sobre e obrigatorio",
    400,
    "Destaque da secao sobre deve ter no maximo 400 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "trialTitle",
    "Titulo da aula experimental e obrigatorio",
    120,
    "Titulo da aula experimental deve ter no maximo 120 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "trialDescription",
    "Descricao da aula experimental e obrigatoria",
    500,
    "Descricao da aula experimental deve ter no maximo 500 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "finalCallToAction",
    "Chamada final e obrigatoria",
    500,
    "Chamada final deve ter no maximo 500 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "counterStudents",
    "Contador de alunos e obrigatorio",
    20,
    "Contador de alunos deve ter no maximo 20 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "counterMedals",
    "Contador de medalhas e obrigatorio",
    20,
    "Contador de medalhas deve ter no maximo 20 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "counterYears",
    "Contador de anos e obrigatorio",
    20,
    "Contador de anos deve ter no maximo 20 caracteres"
  );

  validateIntegerField(
    errors,
    payload,
    "medalCompetitions",
    "Quantidade de competicoes e obrigatoria",
    0,
    "Quantidade de competicoes nao pode ser negativa"
  );
  validateIntegerField(
    errors,
    payload,
    "medalFights",
    "Quantidade de lutas e obrigatoria",
    0,
    "Quantidade de lutas nao pode ser negativa"
  );
  validateIntegerField(
    errors,
    payload,
    "medalGold",
    "Quantidade de medalhas de ouro e obrigatoria",
    0,
    "Quantidade de medalhas de ouro nao pode ser negativa"
  );
  validateIntegerField(
    errors,
    payload,
    "medalSilver",
    "Quantidade de medalhas de prata e obrigatoria",
    0,
    "Quantidade de medalhas de prata nao pode ser negativa"
  );
  validateIntegerField(
    errors,
    payload,
    "medalBronze",
    "Quantidade de medalhas de bronze e obrigatoria",
    0,
    "Quantidade de medalhas de bronze nao pode ser negativa"
  );

  validateRequiredText(
    errors,
    payload,
    "whatsappNumber",
    "Numero do WhatsApp e obrigatorio",
    30,
    "Numero do WhatsApp deve ter no maximo 30 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "instagramHandle",
    "Usuario do Instagram e obrigatorio",
    80,
    "Usuario do Instagram deve ter no maximo 80 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "academyAddress",
    "Endereco da academia e obrigatorio",
    220,
    "Endereco da academia deve ter no maximo 220 caracteres"
  );
  validateRequiredText(
    errors,
    payload,
    "googleMapsEmbed",
    "Link do mapa e obrigatorio",
    600,
    "Link do mapa deve ter no maximo 600 caracteres"
  );

  throwValidationIfNeeded(errors);

  return {
    brandName: payload.brandName.trim(),
    heroTitle: payload.heroTitle.trim(),
    heroSubtitle: payload.heroSubtitle.trim(),
    impactPhrase: payload.impactPhrase.trim(),
    callToActionPrimaryLabel: payload.callToActionPrimaryLabel.trim(),
    callToActionPrimaryUrl: payload.callToActionPrimaryUrl.trim(),
    callToActionSecondaryLabel: payload.callToActionSecondaryLabel.trim(),
    aboutTitle: payload.aboutTitle.trim(),
    aboutStory: payload.aboutStory.trim(),
    aboutHighlight: payload.aboutHighlight.trim(),
    trialTitle: payload.trialTitle.trim(),
    trialDescription: payload.trialDescription.trim(),
    finalCallToAction: payload.finalCallToAction.trim(),
    counterStudents: payload.counterStudents.trim(),
    counterMedals: payload.counterMedals.trim(),
    counterYears: payload.counterYears.trim(),
    medalCompetitions: payload.medalCompetitions,
    medalFights: payload.medalFights,
    medalGold: payload.medalGold,
    medalSilver: payload.medalSilver,
    medalBronze: payload.medalBronze,
    whatsappNumber: payload.whatsappNumber.trim(),
    instagramHandle: payload.instagramHandle.trim(),
    academyAddress: payload.academyAddress.trim(),
    googleMapsEmbed: payload.googleMapsEmbed.trim()
  };
}
