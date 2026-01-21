const axios = require('axios');

module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { code } = req.body;

        if (!code || code.trim() === '') {
            return res.status(400).json({ error: '请输入Java代码' });
        }

        // 获取API密钥
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            console.error('DEEPSEEK_API_KEY is not configured');
            return res.status(500).json({ error: '服务器配置错误' });
        }

        // 构建prompt
        const prompt = `请分析以下Java代码，找出所有缺陷、安全漏洞、性能问题和代码规范问题。请按以下格式返回：

1. 安全问题（Security Issues）
2. 潜在bug（Potential Bugs）
3. 性能问题（Performance Issues）
4. 代码规范问题（Code Style Issues）
5. 最佳实践建议（Best Practice Suggestions）

对于每个问题，请提供：
- 问题描述
- 位置（行号或代码片段）
- 严重程度（高/中/低）
- 修复建议

Java代码：
\`\`\`java
${code}
\`\`\`

请用中文回复，并尽量详细。`;

        // 调用DeepSeek API
        const response = await axios.post(
            process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个资深的Java代码审查专家，擅长发现代码缺陷、安全漏洞和性能问题。请用专业但易懂的语言进行解释。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 4000,
                temperature: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30秒超时
            }
        );

        const result = response.data.choices[0].message.content;

        res.status(200).json({
            success: true,
            result: result,
            model: response.data.model,
            usage: response.data.usage
        });

    } catch (error) {
        console.error('API Error:', error);

        let errorMessage = '分析失败，请稍后重试';
        let statusCode = 500;

        if (error.response) {
            // API返回错误
            statusCode = error.response.status;
            if (error.response.status === 401) {
                errorMessage = 'API密钥无效或过期';
            } else if (error.response.status === 429) {
                errorMessage = '请求过于频繁，请稍后重试';
            } else if (error.response.status === 400) {
                errorMessage = '请求参数错误';
            } else {
                errorMessage = `API错误: ${error.response.status}`;
            }
        } else if (error.request) {
            // 没有收到响应
            errorMessage = '网络连接失败，请检查网络';
        } else if (error.code === 'ECONNABORTED') {
            // 请求超时
            errorMessage = '请求超时，请稍后重试';
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};