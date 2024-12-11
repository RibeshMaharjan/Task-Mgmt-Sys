import url from 'url';
import taskmgr from '../services/database.js';

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

function taskHandler(req, res) {
  if (req.url === '/tasks' && req.method === 'GET') {
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
  } 
}



export default taskHandler;