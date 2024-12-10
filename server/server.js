import { log } from 'console';
import fs from 'fs/promises';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import path from 'path';
import url from 'url';
import taskmgr from './database.js';
const PORT = process.env.PORT;

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
  Authenticate user
*/
const authUser = (req, res) => {
  // Auth user
  if(req.method === 'POST') {
    let body = '';
    
    // Listen for data
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const { token } = JSON.parse(body);

      try {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
          if (err) {
            console.log(err);
            res.writeHead(400, { 'Content-Type': 'application/json'});
            res.end(JSON.stringify({ err: 'Invalid Token' }));
          } else {
            console.log("granted");
            res.writeHead(200, { 'Content-Type': 'application/json' });
            
            res.end(JSON.stringify({
              access: 'granted',
              id: user.id,
              username: user.username
            }));
          }
        });
      } catch (error) {
        console.error('Error parsing JSON:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }
};

// Route handler for GET /tasks
/* 
  GET /tasks
  Purpose: GET all tasks
*/
const getTasksHandler = async (req, res) => {
  // GEt all the taks from the database
  const id = url.parse(req.url, true).query.id;
  const tasks = await taskmgr.getTasks(id);

  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.end(JSON.stringify(tasks));
}

// Route handler for GET /tasks/:id
/* 
  GET /tasks/:id
  Purpose: GET a task
*/
const getTaskByIdHandler = async (req, res) => {
  // Get single task from db
  const id = req.url.split('/').at(-1);
  const task = await taskmgr.getTask(parseInt(id));

  if (task) {
    res.write(JSON.stringify(task));
  } else {
    res.statusCode = 404;
    res.write(JSON.stringify({ message: 'Task not found'}));
  }
  res.end();
};

// Route handler for POST /tasks/
/* 
  POST /tasks/
  Purpose: STORE new task in DB
*/
const createTaskHandler = (req, res) => {
  // Add task into the database
  let body = '';
  // Listen for data
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  req.on('end', async () => {
    const { id, title, status } = JSON.parse(body);
    const newTask = await taskmgr.createTask(id, title, status);
    res.statusCode = 201;
    res.write(JSON.stringify(newTask));
    res.end();
  });
};

/* 
  PATCH /tasks
  Purpose: UPDATE a task
*/
const updateTaskHandler = async (req, res) => {
  // PATCH task in the database
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    const { id, status } = JSON.parse(body);
    const result = await taskmgr.updateTask(parseInt(id), status);

    if(result === 1) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Task updated successfully' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: result }));
    }
  })
};

/* 
  DELETE /tasks/:id
  Purpose: DELETE a task
*/
const deleteTaskHandler = async (req, res) => {
  // DELETE task from the database
  const id = req.url.split('/')[2];
  const result = await taskmgr.deleteTask(parseInt(id));

  if(result === 1) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Task deleted successfully' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: result }));
  }
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

// Not found handler
const notFoundHandler = (req, res) => {
  res.statusCode = 404;
  res.write(JSON.stringify({ message: 'Route not found'}));
  res.end();
}

const server = createServer((req, res) => {
  logger(req, res, async () => {

    jsonMiddleware(req, res, () => {
      if (req.url === '/login' && req.method === 'GET') { 
        getLoginPage(req, res);
      } else if (req.url === '/login' && req.method === 'POST') { 
        loginHandler(req, res);
      } else if (req.url === '/signup' && req.method === 'GET') {
        getSignupPage(req, res);
      } else if (req.url === '/signup' && req.method === 'POST') {
        signupHandler(req, res);
      } else if (req.url === '/index' || req.url === '/' && req.method === 'POST') {
        authUser(req, res);
      } else if (req.url === '/index' || req.url === '/' && req.method === 'GET') {
        getHomepage(req, res);
      } else if (req.url === '/tasks' && req.method === 'GET') {
        getTasksHandler(req, res);
      } else if (req.url.match(/\/tasks\?id=/) && req.method === 'GET') {
        getTasksHandler(req, res);
      } else if (req.url.match(/\/tasks\/([0-9]+)/) && req.method === 'GET') {
        getTaskByIdHandler(req, res);
      } else if (req.url === '/tasks' && req.method === 'POST') { 
        createTaskHandler(req, res);
      } else if (req.url === '/tasks' && req.method === 'PATCH') {    
        updateTaskHandler(req, res);
      } else if (req.url.match(/\/tasks\/([0-9]+)/) && req.method === 'DELETE') {    
        deleteTaskHandler(req, res);
      } else {
        notFoundHandler(req, res);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
})