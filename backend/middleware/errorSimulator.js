export default (req, res, next) => {
  if (req.method === 'PUT' && req.path.startsWith('/pets/')) {
    if (Math.random() < 0.3) {
      return res.status(500).json({ error: 'Simulated server error' });
    }
  }
  next();
};