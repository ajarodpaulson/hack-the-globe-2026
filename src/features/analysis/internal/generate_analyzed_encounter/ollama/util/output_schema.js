import {
  AGE_RANGE_VALUES,
  INCOME_LEVEL_VALUES,
  HOUSING_STATUS_VALUES,
  EMPLOYMENT_STATUS_VALUES,
} from './constants';

const createNullableStringReasoningField = (description, enumValues) => ({
  type: 'object',
  description,
  properties: {
    reason: {
      type: 'string',
      description: 'Explain why this value was selected, or why the available context is insufficient.',
    },
    value: enumValues ? {
      anyOf: [
        {
          type: 'string',
          enum: enumValues,
        },
        {
          type: 'null',
        },
      ],
      description,
    } : {
      anyOf: [
        {
          type: 'string',
        },
        {
          type: 'null',
        },
      ],
      description,
    },
  },
  required: ['reason', 'value'],
  additionalProperties: false,
});

const createNullableStringArrayReasoningField = (description) => ({
  type: 'object',
  description,
  properties: {
    reason: {
      type: 'string',
      description: 'Explain why these values were selected, or why the available context is insufficient.',
    },
    value: {
      anyOf: [
        {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        {
          type: 'null',
        },
      ],
      description,
    },
  },
  required: ['reason', 'value'],
  additionalProperties: false,
});

const classificationItemSchema = {
  type: 'object',
  properties: {
    reason: {
      type: 'string',
      description: 'Explain why this classification was selected.',
    },
    key: {
      type: 'string',
      pattern: '^[a-z0-9_]+$',
      description: 'A stable machine-readable key in lowercase snake_case.',
    },
    label: {
      type: 'string',
      description: 'A short human-readable label for the classification.',
    },
  },
  required: ['reason', 'key', 'label'],
  additionalProperties: false,
};

const classificationCollectionSchema = (description) => ({
  type: 'object',
  description,
  properties: {
    reason: {
      type: 'string',
      description: 'Explain why these classifications were selected, or why none could be supported.',
    },
    values: {
      type: 'array',
      items: classificationItemSchema,
      description,
    },
  },
  required: ['reason', 'values'],
  additionalProperties: false,
});

const outputSchema = {
  type: 'object',
  properties: {
    biographicFactors: {
      type: 'object',
      properties: {
        ageRange: createNullableStringReasoningField(
            'The patient age range bucket, or null when the evidence is insufficient.',
            AGE_RANGE_VALUES,
        ),
        gender: createNullableStringReasoningField(
            'The patient gender as supported by the input, or null when the evidence is insufficient.',
        ),
        incomeLevel: createNullableStringReasoningField(
            'The patient income level bucket, or null when the evidence is insufficient.',
            INCOME_LEVEL_VALUES,
        ),
        raceEthnicity: createNullableStringArrayReasoningField(
            'The patient race or ethnicity values, or null when the evidence is insufficient.',
        ),
        housingStatus: createNullableStringReasoningField(
            'The patient housing status, or null when the evidence is insufficient.',
            HOUSING_STATUS_VALUES,
        ),
        employmentStatus: createNullableStringReasoningField(
            'The patient employment status, or null when the evidence is insufficient.',
            EMPLOYMENT_STATUS_VALUES,
        ),
        language: createNullableStringReasoningField(
            'The patient primary language when supported by the input, or null when the evidence is insufficient.',
        ),
      },
      required: [
        'ageRange',
        'gender',
        'incomeLevel',
        'raceEthnicity',
        'housingStatus',
        'employmentStatus',
        'language',
      ],
      additionalProperties: false,
    },
    upstreamDeterminants: classificationCollectionSchema(
        'The upstream determinants relevant to this patient encounter.',
    ),
    healthIssues: classificationCollectionSchema(
        'The current health issues relevant to this patient encounter.',
    ),
  },
  required: ['biographicFactors', 'upstreamDeterminants', 'healthIssues'],
  additionalProperties: false,
};

export default outputSchema;
