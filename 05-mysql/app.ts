import { join } from 'path';

import express, { static as Static } from 'express';
import { urlencoded } from 'body-parser';

import { get404 } from './controllers/error';
import { execute } from './util/database';

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

import adminRoutes from './routes/admin';
import shopRoutes from './routes/shop';

execute('SELECT * FROM products')
  .then(result => {
    console.log(result[0], result[1]);
  })
  .catch(err => {
    console.log(err);
  });

app.use(urlencoded({ extended: false }));
app.use(Static(join(__dirname, 'public')));

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(get404);

app.listen(3000);
