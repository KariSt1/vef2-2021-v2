import express from 'express';
import xss from 'xss';
import { check, validationResult } from 'express-validator';
import { query, insert } from './db.js';

// TODO skráningar virkni

export const router = express.Router();

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/**
 * Hjálparfall sem XSS hreinsar reit í formi eftir heiti.
 *
 * @param {string} fieldName Heiti á reit
 * @returns {function} Middleware sem hreinsar reit ef hann finnst
 */
function sanitizeXss(fieldName) {
  return (req, res, next) => {
    if (!req.body) {
      next();
    }

    const field = req.body[fieldName];

    if (field) {
      req.body[fieldName] = xss(field);
    }

    next();
  };
}

// Fylki af öllum validations fyrir undirskrift
const validations = [
  check('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),

  check('name')
    .isLength({ max: 128 })
    .withMessage('Nafn má að hámarki vera 128 stafir'),

  check('nationalId')
    .isLength({ min: 1 })
    .withMessage('Kennitala má ekki vera tóm'),

  check('nationalId')
    .matches(/^[0-9]{6}-?[0-9]{4}$/)
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),

  check('comment')
    .isLength({ max: 400 })
    .withMessage('Athugasemd má að hámarki vera 400 stafir'),
];

// Fylki af öllum hreinsunum fyrir umsókn
const sanitazions = [
  check('name').trim().escape(),
  sanitizeXss('name'),

  sanitizeXss('nationalId'),
  check('nationalId')
    .trim().blacklist('-').escape()
    .toInt(),

  sanitizeXss('comment'),
  check('comment').trim().escape(),
];

/**
 * Ósamstilltur route handler fyrir undirskriftir
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Undirskriftarsíðu
 */
async function registrationGet(req, res) {
  const data = {
    title: 'Undirskriftarlisti',
    name: '',
    nationalId: '',
    comment: '',
    anonymous: '',
    date: '',
    errortitle: '',
    errors: [],
  };
  const result = await query('SELECT * from signatures;');
  const { rows, rowCount } = result;

  res.render('index', { data, rows, rowCount });
}

/**
 * Ósamstilltur route handler sem athugar stöðu á undirskrift
 * og birtir villur ef einhverjar,
 * sendir annars áfram í næsta middleware.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 * @returns Næsta middleware ef í lagi, annars síðu með villum
 */
async function showErrors(req, res, next) {
  const {
    body: {
      title = 'Undirskriftarlisti',
      name = '',
      nationalId = '',
      comment = '',
      anonymous = false,
    } = {},
  } = req;

  const data = {
    title,
    name,
    nationalId,
    comment,
    anonymous,
  };

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errors = validation.array();
    data.title = 'Undirskriftarlisti';
    data.errors = errors;
    data.errortitle = 'Villur við undirskrift:';

    const result = await query('SELECT * from signatures;');
    const { rows, rowCount } = result;

    return res.render('index', { data, rows, rowCount });
  }
  return next();
}

/**
 * Ósamstilltur route handler sem vistar undirskrift í gagnagrunn
 * og birtir undirskriftarsíðuna
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Undirskriftarsíðu
 */
async function registrationPost(req, res) {
  const {
    body: {
      name = '',
      nationalId = '',
      comment = '',
      anonymous = false,
    } = {},
  } = req;

  const data = {
    name,
    nationalId,
    comment,
    anonymous,
  };

  await insert(data);
  registrationGet(req, res);
}

router.get('/', registrationGet);
router.post('/', validations,
  showErrors,
  sanitazions,
  catchErrors(registrationPost));
