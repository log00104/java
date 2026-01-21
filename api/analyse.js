// 完整的修复版本
export default async function handler(req, res) {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // 只接受POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: '只允许POST请求'
        });
    }
    
    try {
        const { model, messages, temperature, max_tokens } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'messages字段是必需的且必须是数组'
            });
        }
        
        // 您的DeepSeek API密钥
        const apiKey = 'sk-6216155df6a340edaa60bc6f135a3f30';
        
        // 正确的DeepSeek API端点
        const deepSeekURL = 'https://api.deepseek.com/chat/completions';
        
        console.log('调用DeepSeek API...');
        console.log('消息长度:', messages.length);
        console.log('最后一条消息:', messages[messages.length - 1]?.content?.substring(0, 100) + '...');
        
        const response = await fetch(deepSeekURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'deepseek-chat',
                messages: messages,
                temperature: temperature || 0.1,
                max_tokens: max_tokens || 2000,
                stream: false
            })
        });
        
        console.log('DeepSeek API响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API错误详情:', errorText);
            
            return res.status(response.status).json({
                error: 'DeepSeek API错误',
                status: response.status,
                message: errorText.substring(0, 200)
            });
        }
        
        const data = await response.json();
        console.log('DeepSeek API响应成功');
        
        return res.status(200).json({
            success: true,
            choices: data.choices || [],
            usage: data.usage || {}
        });
        
    } catch (error) {
        console.error('API处理错误:', error);
        
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
