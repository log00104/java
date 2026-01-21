// Vercel Serverless API for DeepSeek
export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { model, messages, temperature, max_tokens } = req.body;

        if (!messages) {
            return res.status(400).json({ error: 'Messages are required' });
        }

        // 使用您的DeepSeek API密钥
        const apiKey = 'sk-6216155df6a340edaa60bc6f135a3f30';

        // DeepSeek API端点
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'deepseek-chat',
                messages: messages,
                temperature: temperature || 0.1,
                max_tokens: max_tokens || 2000,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API error:', response.status, errorText);
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        // 返回标准化响应
        return res.status(200).json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Error in API handler:', error);

        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}