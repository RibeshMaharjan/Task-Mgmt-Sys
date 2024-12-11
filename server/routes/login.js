
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import path from 'path';
import url from 'url';
import taskmgr from '../services/database.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __root = path.join(__dirname, '../', '../', '/public');

/* 
  GET /login
  Purpose: load login page
*/
const getLoginPage = async (req, res) => {
  const file = await fs.readFile(path.join(__root, '/login.html'));
  
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.write(file);
  res.end();
};

/* 
  GET /signup
  Purpose: load signup page
*/
const getSignupPage = async (req, res) => {
  const file = await fs.readFile(path.join(__root, '/signup.html'));
  
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.write(file);
  res.end();
};

/* 
  POST /login
  Purpose: AUTHENTICATE the user
*/
const loginHandler = (req, res) => {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    const { username, password } = JSON.parse(body);
    const user = await taskmgr.getUser(username, password);

    if (typeof user !== 'object') {
      res.statusCode = 404;
      res.write(JSON.stringify({ message: user}));
    } else {
      const { id, username } = user;
      
      const accessToken = jwt.sign({ id, username}, process.env.ACCESS_TOKEN_SECRET);
      
      res.setHeader('Set-Cookie', `uid=${accessToken}; Max-Age=3600`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      
      res.end(JSON.stringify({
        access: 'granted'
      }));
    }
    res.end();
  });
};

/* 
  POST /signin
  Purpose: REGISTER new user
*/
const signupHandler = (req, res) => {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    const { username, password } = JSON.parse(body);
    
    const result = await taskmgr.createUser(username, password);
    
    console.log(result);
    
    if (result) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'success' }));
    }
  });
}

const authHandler = (req, res) => {
  if (req.url === '/login' && req.method === 'GET') { 
    getLoginPage(req, res);
  } else if (req.url === '/login' && req.method === 'POST') { 
    loginHandler(req, res);
  } else if (req.url === '/signup' && req.method === 'GET') {
    getSignupPage(req, res);
  } else if (req.url === '/signup' && req.method === 'POST') {
    signupHandler(req, res);
  }
}

export default authHandler;