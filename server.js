require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// DeepSeek Client Configuration
const client = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

// Polish Endpoint
app.post('/api/polish', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const completion = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a professional English speaking coach. Your task is to polish the user's input into authentic native English. Strictly return valid JSON only.\n\nRules:\n1. 'polished': For longer text, insert newline characters (\\n) to break lines by sense groups or sentences, making it read like a script or poem.\n2. 'analysis': Use Chinese for explanation. When referring to specific words, grammar points, or original sentences, strictly quote the English original. Example: '这里建议使用 available 而不是 there，因为...'\n\nJSON Structure: { 'polished': 'The polished English text', 'score': 85 (integer 0-100), 'analysis': 'Explanation in Chinese with English quotes...', 'vocabulary': [{'word': '...', 'ipa': '...', 'meaning': '...'}], 'idioms': [{'phrase': '...', 'meaning': '...'}] }"
                },
                {
                    role: "user",
                    content: text
                }
            ],
            model: "deepseek-chat",
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content);
        res.json(result);

    } catch (error) {
        console.error('Error polishing text:', error);
        res.status(500).json({
            error: 'Failed to polish text',
            details: error.message
        });
    }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
