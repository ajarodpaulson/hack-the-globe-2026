import dynamo from 'dynamodb-v3';
import Joi from 'joi';
import configureDynamo from './configure_dynamo.js';

configureDynamo();

const classificationSchema = Joi.object({
  key: Joi.string().required(),
  label: Joi.string().required(),
});

const biographicFactorsSchema = Joi.object({
  ageRange: Joi.string().valid(
      '0-4',
      '5-12',
      '13-17',
      '18-24',
      '25-34',
      '35-44',
      '45-54',
      '55-64',
      '65-74',
      '75+',
  ).optional(),
  gender: Joi.string().optional(),
  incomeLevel: Joi.string().valid(
      'very_low',
      'low',
      'lower_middle',
      'middle',
      'upper_middle',
      'high',
  ).optional(),
  raceEthnicity: Joi.array().items(Joi.string()).min(1).optional(),
  housingStatus: Joi.string().valid(
      'stable',
      'unstable',
      'homeless',
      'sheltered',
      'unknown',
  ).optional(),
  employmentStatus: Joi.string().valid(
      'employed',
      'unemployed',
      'underemployed',
      'student',
      'retired',
      'unable_to_work',
      'unknown',
  ).optional(),
  language: Joi.string().optional(),
}).min(1);

const geographicDataSchema = Joi.object({
  postalCodePrefix: Joi.string()
      .trim()
      .uppercase()
      .pattern(/^[A-Z]\d[A-Z]$/)
      .required(),
});

const ddb = dynamo.define('Analyzed_Encounter', {
  tableName: 'Analyzed_Encounter',
  hashKey: 'analyzedEncounterRn',
  schema: {
    analyzedEncounterRn: Joi.string().required(),
    biographicFactors: biographicFactorsSchema.optional(),
    geographicData: geographicDataSchema.optional(),
    upstreamDeterminants: Joi.array().items(classificationSchema).required(),
    healthIssues: Joi.array().items(classificationSchema).required(),
  },
  timestamps: true,
});

const create = async (analyzedEncounter) => {
  const result = await ddb.create(analyzedEncounter);
  return result ? result.attrs : null;
};

const getAll = async () => {
  const result = await new Promise((resolve, reject) => {
    ddb
        .scan()
        .loadAll()
        .exec((error, data) => (error ? reject(error) : resolve(data)));
  });
  return result?.Items?.map((item) => item.attrs) ?? [];
};

const analyzedDataDdb = {
  create,
  getAll,
};

export {
  create,
  getAll,
};

export default analyzedDataDdb;
