// import { log } from 'console';
import fs from 'fs/promises';
import http from 'http';
import path from 'path';
import url from 'url';
const PORT = process.env.PORT;

// Get current path
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// console.log(__filename, __dirname);


const server = http.createServer(async (req, res) => {
  try {
    // Check if GET request
    if(req.method === 'GET') {
      let filePath;
      if(req.url === '/' || req.url === '/home') {
        filePath = path.join(__dirname, '../', 'public', 'index.html');
      } else if(req.url === '/login') {
        filePath = path.join(__dirname, '../', 'public', 'login.html');
      } else {
        throw new Error('Not Found')
      }

      const data = await fs.readFile(filePath);
      res.setHeader('Conten-TYpe', 'text/html');
      res.write(data);
      res.end();

    } else {
      throw new Error('Method not allowed')
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server Error');
  }
  
});

server.listen(PORT, () => {
  console.log(`Server running on prot ${PORT}`);
});