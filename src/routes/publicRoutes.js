const express = require('express');
const rateLimit = require('express-rate-limit');
const { db } = require('../config/firebase');

const router = express.Router();

// Limita envios para evitar spam durante o evento (máx. 10 perguntas a cada 5 min por IP)
const submitLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: { error: 'Muitas perguntas enviadas em pouco tempo. Aguarde alguns minutos.' },
});

const statusDocRef = db.collection('configuracoes').doc('status_evento');
const questionsCollRef = db.collection('perguntas');

// GET /api/public/status
router.get('/status', async (req, res) => {
    try {
        const docSnap = await statusDocRef.get();
        if (!docSnap.exists) {
            await statusDocRef.set({ isOpen: true, updatedAt: new Date().toISOString() });
            return res.json({ isOpen: true });
        }
        return res.json({ isOpen: docSnap.data().isOpen ?? true });
    } catch (error) {
        console.error('Erro ao buscar status:', error);
        return res.status(500).json({ error: 'Erro interno ao consultar status do evento.' });
    }
});

// POST /api/public/questions
router.post('/questions', submitLimiter, async (req, res) => {
    try {
        const statusSnap = await statusDocRef.get();
        const isOpen = statusSnap.exists ? statusSnap.data().isOpen : true;

        if (!isOpen) {
            return res.status(403).json({ error: 'O envio de perguntas está encerrado no momento.' });
        }

        const name = typeof req.body.name === 'string' && req.body.name.trim()
            ? req.body.name.trim().slice(0, 80)
            : 'Anônimo';

        const question = typeof req.body.question === 'string'
            ? req.body.question.trim().slice(0, 1000)
            : '';

        if (!question) {
            return res.status(400).json({ error: 'O texto da pergunta é obrigatório.' });
        }

        const newDoc = await questionsCollRef.add({
            name,
            question,
            answered: false,
            timestamp: new Date().toISOString(),
        });

        return res.status(201).json({
            id: newDoc.id,
            message: 'Pergunta registrada com sucesso!',
        });
    } catch (error) {
        console.error('Erro ao salvar pergunta:', error);
        return res.status(500).json({ error: 'Não foi possível registrar sua pergunta.' });
    }
});

module.exports = router;