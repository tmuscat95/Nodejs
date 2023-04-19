const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const adminRoutes = require('./routes/admin'); //outsourced routes
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended: false})); //middleware that parses bodies of type form-url-encoded into JSON
app.use(express.static(path.join(__dirname, 'public'))); //adding static files in the public folder to the middleware pipeline.
app.use("/",(req,res,next)=>{
    next(); 
    /**
     * Generic middleware; middleware takes an optional path as first argument and will be used for all requests
     * starting with that path; if path is / or not given; it will be used for all paths.
     * next() must be called to pass the request to the next middleware in the pipeline.
     * If next is not called; request stops there and doesn't propagate further to further middlewares.
     * app.use() will match all requests regardless of method; app.get app.post app.patch app.put etc 
     * can be used to more precisely match request based on method.
     */
});
app.use('/admin', adminRoutes); //adding outsourced routes to the middleware pipeline; middleware will be called for all routes beginning with /admin 
app.use(shopRoutes);

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});//will be hit if no other middleware has been hit by the URL.

app.listen(3000);
