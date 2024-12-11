import jwt from 'jsonwebtoken';

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

export default authUser;