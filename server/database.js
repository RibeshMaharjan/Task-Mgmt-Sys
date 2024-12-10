import mysql from 'mysql2';

const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB
}).promise();

async function getTasks(id) {
  const [rows] = await pool.query(`
  SELECT * 
  FROM tasks
  WHERE user_id = ?
  `, [id]);
  return rows;
}

async function getTask(id) {
  const [rows] = await pool.query(`
  SELECT * 
  FROM tasks 
  WHERE id = ?
  `, [id]);
  return rows[0];
}

async function createTask(userId, title, status) {
  const [result] = await pool.query(`
  INSERT INTO tasks (user_id, title, status)
  VALUES (?, ?, ?)
  `, [userId, title, status]);
  return getTask(result.insertId);
}

async function updateTask(id, status) {
  try {
    const [result] = await pool.query(`
    UPDATE tasks 
    SET status = ?
    WHERE id = ?
    `, [status, id]);
    
    if(result.changedRows === 0) {
      return `Task could not be update`;
    }
  
    return result.changedRows;
  } catch (error) {
    return `Error: ${error}`;
  }
}

async function deleteTask(id) {
  const [result] = await pool.query(`
  DELETE
  FROM tasks
  WHERE id = '?'
  `, [id]);

  if(result.affectedRows === 0) {
    return `Task not found`;
  }

  return result.affectedRows;
}

async function getUser(username, password) {
  try {
    const [row] = await pool.query(`
    SELECT id, username 
    FROM users 
    WHERE username = ? AND 
    password = ?
    `, [username, password]);

    if(row[0] === undefined) return 'Incorrect username or password';

    return row[0];
  } catch (error) {
    return `Error fetching user: ${error}`;
  }
}

async function createUser(username, password) {
  // const userExist = await getUser(username, password);
  const [userExist] = await pool.query(`
  SELECT * 
  FROM users 
  WHERE username = ? 
  `, [username]);

  if(userExist[0]) {
    return `Username already taken`;
  }

  try {
    const [result] = await pool.query(`
    INSERT INTO users (username, password) 
    VALUES (?,?)
    `, [username, password]);

    const status = await getUser(username, password);

    return status;
  } catch (error) {
    return `Error inserting user: ${error}`;
  }  
}


export default {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getUser,
  createUser
};
