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

// Scenario Evaluation Endpoint
app.post('/api/evaluate-scenario', async (req, res) => {
    try {
        const { history, scenarioTitle } = req.body;

        if (!history || !Array.isArray(history)) {
            return res.status(400).json({ error: 'Valid history array is required' });
        }

        const completion = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert English teacher evaluating a student's performance in a role-play scenario: "${scenarioTitle}".\n\nTask:\nAnalyze the student's inputs (marked as 'user') against the expected standard (marked as 'standard').\n\nReturn Valid JSON:\n{\n  "score": 85, // Overall integer score (0-100)\n  "feedback": "General feedback in Chinese...",\n  "improvements": [\n    {\n      "original": "User's mistake",\n      "better": "Better expression",\n      "reason": "Explanation in Chinese"\n    }\n  ]\n}`
                },
                {
                    role: "user",
                    content: JSON.stringify(history)
                }
            ],
            model: "deepseek-chat",
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content);
        res.json(result);

    } catch (error) {
        console.error('Error evaluating scenario:', error);
        res.status(500).json({
            error: 'Failed to evaluate scenario',
            details: error.message
        });
    }
});

// Reading Process Endpoint
app.post('/api/process-reading', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const completion = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `你是一个专业的英语领读助教。请将用户输入的英语文本按意群或句子进行智能拆分，并为每一句提供地道的中文翻译。

拆分规则： 遇到长难句时，请按照语意节奏拆分成更短的单元，方便朗读。

返回格式： 必须是严格的 JSON 对象： { "sentences": [ { "en": "英文内容", "cn": "中文翻译" }, ... ] }`
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
        console.error('Error processing reading text:', error);
        res.status(500).json({
            error: 'Failed to process text',
            details: error.message
        });
    }
});



// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
