
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const messages = require('../../mock-messages.json');
    res.status(200).json(messages);
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
