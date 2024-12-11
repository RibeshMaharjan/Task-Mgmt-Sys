import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import logingHandler from './routes/login.js';
import taskHandler from './routes/tasks.js';
import authUser from './services/auth.js';

// Logger middleware
const logger = async (req, res, next) => {
  console.log(`${req.method} ${req.url} ${req.body}`);
  next();
};

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __root = path.join(__dirname, '../', '/public');

// JSON middleware
const jsonMiddleware = (req, res, next) => {
  res.setHeader('Content-Type',  'application/json');
  next();
};

/* 
  GET /
  Purpose: GET Homepage
*/
const getHomepage = async (req, res) => {
  const file = await fs.readFile(path.join(__root, '/index.html'));
  
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.write(file);
  res.end();
};

// Not found handler
const notFoundHandler = (req, res) => {
  res.statusCode = 404;
  res.write(JSON.stringify({ message: 'Route not found'}));
  res.end();
}


async function app(req, res) {
  logger(req, res, async () => {

    jsonMiddleware(req, res, () => {
      if (req.url === '/login' || req.url === '/signup') {
        logingHandler(req, res)
      } else if (req.url === '/index' || req.url === '/' && req.method === 'POST') {
        authUser(req, res);
      } else if (req.url === '/index' || req.url === '/' && req.method === 'GET') {
        getHomepage(req, res);
      } else if (req.url.match(/\/tasks/)) {
        taskHandler(req, res);
      }else {
        notFoundHandler(req, res);
      }
    });
  });
}
export default app;