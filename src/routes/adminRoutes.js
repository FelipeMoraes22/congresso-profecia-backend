const express = require('express');
const { db } = require('../config/firebase');
const { verifyAdminToken } = require('../middlewares/authMiddleware');

const router = express.Router();
const statusDocRef = db.collection('configuracoes').doc('status_evento');
const questionsCollRef = db.collection('perguntas');

// Todas as rotas abaixo exigem token JWT válido
router.use(verifyAdminToken);

// GET /api/admin/questions
router.get('/questions', async (req, res) => {
    try {
        const snapshot = await questionsCollRef.orderBy('timestamp', 'desc').get();
        const questions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return res.json({ questions });
    } catch (error) {
        console.error('Erro ao listar perguntas:', error);
        return res.status(500).json({ error: 'Erro ao carregar lista de perguntas.' });
    }
});

// PATCH /api/admin/status
router.patch('/status', async (req, res) => {
    try {
        const { isOpen } = req.body;
        if (typeof isOpen !== 'boolean') {
            return res.status(400).json({ error: 'O campo isOpen deve ser booleano.' });
        }

        await statusDocRef.set(
            { isOpen, updatedAt: new Date().toISOString() },
            { merge: true }
        );

        return res.json({ isOpen });
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        return res.status(500).json({ error: 'Erro ao atualizar status do evento.' });
    }
});

// PATCH /api/admin/questions/:id
router.patch('/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { answered } = req.body;

        if (typeof answered !== 'boolean') {
            return res.status(400).json({ error: 'O campo answered deve ser booleano.' });
        }

        await questionsCollRef.doc(id).update({ answered });
        return res.json({ id, answered });
    } catch (error) {
        console.error('Erro ao atualizar pergunta:', error);
        return res.status(500).json({ error: 'Erro ao atualizar status da pergunta.' });
    }
});

// DELETE /api/admin/questions/:id
router.delete('/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await questionsCollRef.doc(id).delete();
        return res.json({ id, deleted: true });
    } catch (error) {
        console.error('Erro ao excluir pergunta:', error);
        return res.status(500).json({ error: 'Erro ao excluir pergunta.' });
    }
});

module.exports = router;