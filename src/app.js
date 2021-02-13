import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import date from 'date-and-time';
import { router as registrationRouter } from './registration.js';

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;

let path = dirname(fileURLToPath(import.meta.url));
path = path.substring(0, path.length - 4);

const app = express();
app.use(express.urlencoded({ extended: true }));

// TODO setja upp rest af virkni!
app.set('views', './src/views');
app.set('view engine', 'ejs');

app.use(express.static(join(path, './public')));

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field Middleware sem grípa á villur fyrir
 * @param {array} errors Fylki af villum frá express-validator pakkanum
 * @returns {boolean} `true` ef `field` er í `errors`, `false` annars
 */
function isInvalid(field, errors) {
  return Boolean(errors.find((i) => i.param === field));
}

/**
 * Hjálparfall til að breyta dagsetningu yfir á formið "DD.MM.YYYY"
 * @param {String} Dagsetning sem á að formatta
 * @returns {String} Formattaður strengur
 */
function parseDate(d) {
  return date.format(new Date(d), 'DD[.]MM[.]YYYY');
}

app.locals.isInvalid = isInvalid;
app.locals.parseDate = parseDate;

app.use('/', registrationRouter);

/**
 * Middleware sem sér um 404 villur.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 */
function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { title: 'Síða fannst ekki', error: '404 fannst ekki' });
}

/**
 * Middleware sem sér um villumeðhöndlun.
 *
 * @param {object} err Villa sem kom upp
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 */
function errorHandler(error, req, res, next) { // eslint-disable-line
  console.error(error);
  res.status(500).render('error', { title: 'Gat ekki skráð!', error: 'Hafðir þú skrifað undir áður?' });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
