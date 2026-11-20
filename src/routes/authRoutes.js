const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { password } = req.body;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Senha de administrador incorreta.' });
    }

    const token = jwt.sign(
        { role: 'admin', event: 'congresso-profecia' },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
    );

    return res.json({ token, expiresIn: '12h' });
});

module.exports = router;
