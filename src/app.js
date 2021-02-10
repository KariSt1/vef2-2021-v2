import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { query } from './db.js';
import { router as registrationRouter } from './registration.js';
import { allowedNodeEnvironmentFlags } from 'process';
import date from 'date-and-time';

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;

let path = dirname(fileURLToPath(import.meta.url));
path = path.substring(0, path.length -4);

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
  return Boolean(errors.find(i => i.param === field));
}

function parseDate(d) {
  return date.format(new Date(d), 'DD[.]MM[.]YYYY');
}

app.locals.isInvalid = isInvalid;
app.locals.parseDate = parseDate;


app.use('/', registrationRouter);

function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { title: 'Síða fannst ekki', error: '404 fannst ekki' });
}

function errorHandler(error, req, res, next) { // eslint-disable-line
  console.error(error);
  res.status(500).render('error', { title: 'Gat ekki skráð!', error: 'Hafðir þú skrifað undir áður?' });
}

app.use(notFoundHandler);
app.use(errorHandler);

// Verðum að setja bara *port* svo virki á heroku
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
