import express from 'express';
import { query, select, insert } from './db.js';
import xss from 'xss';
import { check, validationResult, sanitize } from 'express-validator';

// TODO skráningar virkni

export const router = express.Router();

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
    .withMessage('Athugasemd má að hámarki vera 400 stafir')
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
      console.log(req.body[fieldName]);
    }

    next();
  };
}

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
  const rows = result.rows;
  const rowCount = result.rowCount;

  res.render('index', { data, rows, rowCount });
}

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
    const rows = result.rows;
    const rowCount = result.rowCount;

    return res.render('index', { data, rows, rowCount });
  }
  return next();
}

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
  console.log('EFTIR INSERT DATA');
  registrationGet(req, res);
}

router.get('/', registrationGet);
router.post('/', validations,
  showErrors,
  sanitazions,
  catchErrors(registrationPost)
);
