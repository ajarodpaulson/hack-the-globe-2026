import Joi from 'joi';

const reasoningStringSchema = Joi.object({
  reason: Joi.string().trim().required(),
  value: Joi.alternatives().try(Joi.string(), Joi.valid(null)).required(),
}).required().unknown(false);

const reasoningStringArraySchema = Joi.object({
  reason: Joi.string().trim().required(),
  value: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.valid(null)).required(),
}).required().unknown(false);

const classificationItemSchema = Joi.object({
  reason: Joi.string().trim().required(),
  key: Joi.string().trim().required(),
  label: Joi.string().trim().required(),
}).unknown(false);

const classificationCollectionSchema = Joi.object({
  reason: Joi.string().trim().required(),
  values: Joi.array().items(classificationItemSchema).required(),
}).required().unknown(false);

const analysisOutputSchema = Joi.object({
  biographicFactors: Joi.object({
    ageRange: reasoningStringSchema.required(),
    gender: reasoningStringSchema.required(),
    incomeLevel: reasoningStringSchema.required(),
    raceEthnicity: reasoningStringArraySchema.required(),
    housingStatus: reasoningStringSchema.required(),
    employmentStatus: reasoningStringSchema.required(),
    language: reasoningStringSchema.required(),
  }).required().unknown(false),
  upstreamDeterminants: classificationCollectionSchema.required(),
  healthIssues: classificationCollectionSchema.required(),
}).required().unknown(false);

const validate = (analysisOutput) => {
  const {error, value} = analysisOutputSchema.validate(analysisOutput, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    throw new Error(`Invalid analysis output: ${error.message}`);
  }

  return value;
};

const normalizeBiographicFactors = (biographicFactors) => {
  const normalizedBiographicFactors = {};

  if (biographicFactors.ageRange.value !== null) {
    normalizedBiographicFactors.ageRange = biographicFactors.ageRange.value;
  }

  if (biographicFactors.gender.value !== null) {
    normalizedBiographicFactors.gender = biographicFactors.gender.value;
  }

  if (biographicFactors.incomeLevel.value !== null) {
    normalizedBiographicFactors.incomeLevel = biographicFactors.incomeLevel.value;
  }

  if (Array.isArray(biographicFactors.raceEthnicity.value) && biographicFactors.raceEthnicity.value.length > 0) {
    normalizedBiographicFactors.raceEthnicity = biographicFactors.raceEthnicity.value;
  }

  if (biographicFactors.housingStatus.value !== null) {
    normalizedBiographicFactors.housingStatus = biographicFactors.housingStatus.value;
  }

  if (biographicFactors.employmentStatus.value !== null) {
    normalizedBiographicFactors.employmentStatus = biographicFactors.employmentStatus.value;
  }

  if (biographicFactors.language.value !== null) {
    normalizedBiographicFactors.language = biographicFactors.language.value;
  }

  return normalizedBiographicFactors;
};

const normalizeClassificationCollection = (collection) => collection.values.map((item) => ({
  key: item.key,
  label: item.label,
}));

const process = (analysisOutput) => {
  const validatedOutput = validate(analysisOutput);
  const normalizedBiographicFactors = normalizeBiographicFactors(
    validatedOutput.biographicFactors,
  );

  return {
    ...(Object.keys(normalizedBiographicFactors).length > 0
      ? { biographicFactors: normalizedBiographicFactors }
      : {}),
    upstreamDeterminants: normalizeClassificationCollection(
      validatedOutput.upstreamDeterminants,
    ),
    healthIssues: normalizeClassificationCollection(
      validatedOutput.healthIssues,
    ),
  };
};

const analysisOutputProcessor = {
  process,
};

export { process };

export default analysisOutputProcessor;
