import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { query } from './db.js';
import { router as registrationRouter } from './registration.js';
import { allowedNodeEnvironmentFlags } from 'process';

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

app.locals.isInvalid = isInvalid;


app.use('/', registrationRouter);
// app.get('/', async (req, res) => {
//   const title = 'Undirskriftarlisti';
//   const result = await query('SELECT * from signatures;');
//   console.log('result :>> ', result);

//   res.render('index', { title });
// });

// app.post('/post', (req, res) => {
//   res.send(`POST gögn: ${JSON.stringify(req.body)}`);
// });

// Verðum að setja bara *port* svo virki á heroku
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
