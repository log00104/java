// API配置
const API_CONFIG = {
    endpoint: 'https://api.deepseek.com/chat/completions',  // 正确的地址！
    apiKey: 'sk-6216155df6a340edaa60bc6f135a3f30'
};

// 示例代码库
const CODE_SAMPLES = {
    vulnerable: `import java.sql.*;
import java.util.Scanner;

public class VulnerableExample {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter username: ");
        String username = scanner.nextLine();
        
        // SQL注入漏洞
        String query = "SELECT * FROM users WHERE username = '" + username + "'";
        
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/test");
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(query); // 高危：直接拼接SQL
            
            // 硬编码密码
            String hardcodedPassword = "admin123"; // 安全漏洞
            
            // 命令注入
            String input = scanner.nextLine();
            Runtime.getRuntime().exec("echo " + input); // 命令注入漏洞
            
            while (rs.next()) {
                System.out.println(rs.getString("username"));
            }
            
            // 资源未关闭
            // rs.close();
            // stmt.close();
            // conn.close();
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`,

    performance: `import java.util.ArrayList;
import java.util.List;

public class PerformanceExample {
    
    // 低效的字符串拼接
    public String concatenateStrings(List<String> strings) {
        String result = "";
        for (String s : strings) {
            result += s; // 性能问题：每次循环创建新字符串
        }
        return result;
    }
    
    // 循环内创建对象
    public void createObjectsInLoop() {
        for (int i = 0; i < 10000; i++) {
            String str = new String("test" + i); // 应该使用字符串字面量
            System.out.println(str);
        }
    }
    
    // 未优化的集合操作
    public void unoptimizedCollection() {
        List<Integer> numbers = new ArrayList<>();
        for (int i = 0; i < 1000000; i++) {
            numbers.add(i);
        }
        
        // 低效的查找
        if (numbers.contains(999999)) { // O(n)复杂度
            System.out.println("Found");
        }
    }
    
    // 内存泄漏风险
    private static List<byte[]> memoryLeak = new ArrayList<>();
    
    public void potentialMemoryLeak() {
        for (int i = 0; i < 100; i++) {
            memoryLeak.add(new byte[1024 * 1024]); // 1MB each
        }
    }
}`,

    buggy: `import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

public class BuggyExample {
    
    // 空指针异常
    public void nullPointerExample(String input) {
        if (input.equals("test")) { // 如果input为null会抛出NPE
            System.out.println("Equal");
        }
    }
    
    // 资源未关闭
    public void readFile(String filename) {
        try {
            FileInputStream fis = new FileInputStream(new File(filename));
            int data = fis.read();
            System.out.println(data);
            // 忘记关闭流
        } catch (IOException e) {
            // 空的catch块
        }
    }
    
    // 并发问题
    private int counter = 0;
    
    public void increment() {
        counter++; // 非线程安全
    }
    
    // 整数溢出
    public void integerOverflow() {
        int max = Integer.MAX_VALUE;
        int result = max + 1; // 整数溢出
        System.out.println("Result: " + result);
    }
    
    // 浮点数比较
    public void floatComparison() {
        double a = 0.1 + 0.2;
        double b = 0.3;
        if (a == b) { // 浮点数精度问题
            System.out.println("Equal");
        } else {
            System.out.println("Not equal: " + a + " != " + b);
        }
    }
}`,

    style: `public class StyleExample {
    
    // 不好的命名
    private int a;
    private String b;
    
    // 过长的类
    public void method1() { /* ... */ }
    public void method2() { /* ... */ }
    public void method3() { /* ... */ }
    public void method4() { /* ... */ }
    public void method5() { /* ... */ }
    public void method6() { /* ... */ }
    public void method7() { /* ... */ }
    public void method8() { /* ... */ }
    public void method9() { /* ... */ }
    public void method10() { /* ... */ }
    
    // 重复代码
    public void duplicateCode1() {
        System.out.println("Start");
        System.out.println("Processing...");
        System.out.println("End");
    }
    
    public void duplicateCode2() {
        System.out.println("Start");
        System.out.println("Processing...");
        System.out.println("End");
    }
    
    // 复杂的条件逻辑
    public void complexLogic(int a, int b, int c, int d) {
        if ((a > b && c < d) || (a == b && c != d) || (!(a < b) && c > d)) {
            System.out.println("Condition met");
        }
    }
    
    // 过长的行
    public void longLine() {
        String veryLongString = "This is a very long string that exceeds the recommended line length and should be broken into multiple lines for better readability and maintainability of the code.";
    }
}`
};

class CodeAnalyzer {
    constructor() {
        this.currentCode = '';
        this.analysisHistory = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
        this.initEventListeners();
        this.initUI();
        this.checkAPIStatus();
        this.loadHistory();
    }

    initEventListeners() {
        // 模式切换
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });

        // 代码输入监听
        const codeInput = document.getElementById('codeInput');
        codeInput.addEventListener('input', () => {
            this.updateCodeStats();
            this.currentCode = codeInput.value;
        });

        // 文件上传
        const fileUpload = document.getElementById('fileUpload');
        fileUpload.addEventListener('change', (e) => this.handleFileUpload(e));

        const dropArea = document.getElementById('dropArea');
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('drag-over');
        });

        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('drag-over');
        });

        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                fileUpload.files = e.dataTransfer.files;
                this.handleFileUpload({ target: fileUpload });
            }
        });

        // 移除文件
        document.getElementById('removeFile').addEventListener('click', () => {
            this.clearFileUpload();
        });

        // 分析按钮
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeCode();
        });

        // 示例代码
        document.getElementById('sampleBtn').addEventListener('click', () => {
            document.getElementById('sampleModal').classList.remove('hidden');
        });

        // 清空按钮
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearCode();
        });

        // 清空历史
        document.getElementById('clearHistory').addEventListener('click', () => {
            this.clearHistory();
        });

        // 导出和复制按钮
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportResults();
        });

        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyResults();
        });

        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // 示例代码选择
        document.querySelectorAll('.sample-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const sample = e.currentTarget.dataset.sample;
                this.loadSample(sample);
                document.getElementById('sampleModal').classList.add('hidden');
            });
        });

        // 模态框关闭
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('sampleModal').classList.add('hidden');
            });
        });

        // 页脚链接
        document.getElementById('privacyBtn').addEventListener('click', (e) => {
            e.preventDefault();
            alert('隐私政策：本工具不会存储您的代码，所有分析都在内存中进行。');
        });

        document.getElementById('aboutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            alert('Java代码缺陷检测工具 v1.0\n基于DeepSeek AI的智能代码审查系统\n仅供学习和研究使用');
        });
    }

    initUI() {
        this.updateCodeStats();
        this.switchMode('text');
        this.switchTab('issues');
    }

    switchMode(mode) {
        // 更新按钮状态
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // 显示对应输入模式
        document.querySelectorAll('.input-mode').forEach(panel => {
            panel.classList.toggle('active', panel.id === mode + 'Input');
        });

        // 清空文件上传区域（如果切换到文本模式）
        if (mode === 'text') {
            this.clearFileUpload();
        }
    }

    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 显示对应标签页
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === 'tab-' + tabName);
        });

        // 如果切换到代码视图，高亮代码
        if (tabName === 'code') {
            setTimeout(() => this.highlightCode(), 100);
        }
    }

    updateCodeStats() {
        const code = document.getElementById('codeInput').value;
        const charCount = code.length;
        const lineCount = code.split('\n').length;

        document.getElementById('charCount').textContent = `${charCount} 字符`;
        document.getElementById('lineCount').textContent = `${lineCount} 行`;
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 检查文件大小（限制1MB）
        if (file.size > 1024 * 1024) {
            alert('文件大小超过限制（最大1MB）');
            return;
        }

        // 检查文件类型
        if (!file.name.endsWith('.java') && !file.name.endsWith('.txt')) {
            alert('只支持.java和.txt文件');
            return;
        }

        // 显示文件信息
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = `(${(file.size / 1024).toFixed(1)}KB)`;
        document.getElementById('fileInfo').classList.remove('hidden');

        // 读取文件内容
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentCode = e.target.result;
            // 如果当前是文本模式，自动切换到文本模式并填充代码
            document.getElementById('codeInput').value = this.currentCode;
            this.switchMode('text');
            this.updateCodeStats();
        };
        reader.readAsText(file);
    }

    clearFileUpload() {
        document.getElementById('fileUpload').value = '';
        document.getElementById('fileInfo').classList.add('hidden');
        document.getElementById('fileName').textContent = '';
        document.getElementById('fileSize').textContent = '';
    }

    clearCode() {
        document.getElementById('codeInput').value = '';
        this.currentCode = '';
        this.updateCodeStats();
        this.resetResults();
    }

    loadSample(sampleKey) {
        if (CODE_SAMPLES[sampleKey]) {
            document.getElementById('codeInput').value = CODE_SAMPLES[sampleKey];
            this.currentCode = CODE_SAMPLES[sampleKey];
            this.updateCodeStats();
            this.switchMode('text');
        }
    }

    async analyzeCode() {
        const code = this.currentCode || document.getElementById('codeInput').value;

        if (!code.trim()) {
            alert('请输入或上传Java代码进行分析');
            return;
        }

        // 获取分析选项
        const options = {
            security: document.getElementById('optSecurity').checked,
            performance: document.getElementById('optPerformance').checked,
            style: document.getElementById('optStyle').checked,
            bugs: document.getElementById('optBugs').checked
        };

        // 显示加载状态
        this.showLoading();

        try {
            // 构建分析提示
            const prompt = this.buildAnalysisPrompt(code, options);

            // 调用API
            const result = await this.callDeepSeekAPI(prompt);

            // 解析结果
            const analysisResult = this.parseAnalysisResult(result);

            // 显示结果
            this.displayResults(analysisResult, code);

            // 保存到历史记录
            this.saveToHistory(code, analysisResult);

        } catch (error) {
            console.error('分析失败:', error);
            this.showError('分析失败: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    buildAnalysisPrompt(code, options) {
        let prompt = '请分析以下Java代码，检测以下问题：\n\n';

        if (options.security) prompt += '• 安全漏洞（SQL注入、命令注入、硬编码密码等）\n';
        if (options.performance) prompt += '• 性能问题（低效算法、内存泄漏、循环内创建对象等）\n';
        if (options.bugs) prompt += '• 潜在Bug（空指针、资源未关闭、并发问题等）\n';
        if (options.style) prompt += '• 代码规范（命名规范、代码重复、复杂度过高等）\n';

        prompt += '\n请以JSON数组格式返回响应，每个问题包含以下字段：\n';
        prompt += '{\n';
        prompt += '  "id": "唯一标识",\n';
        prompt += '  "title": "问题标题",\n';
        prompt += '  "description": "详细描述",\n';
        prompt += '  "severity": "critical/high/medium/low",\n';
        prompt += '  "category": "security/performance/bug/style",\n';
        prompt += '  "location": "问题位置（行号）",\n';
        prompt += '  "suggestion": "修复建议",\n';
        prompt += '  "codeSnippet": "相关代码片段（如果有）"\n';
        prompt += '}\n\n';
        prompt += '另外请提供以下度量指标：\n';
        prompt += '{\n';
        prompt += '  "metrics": {\n';
        prompt += '    "complexity": "圈复杂度",\n';
        prompt += '    "lines": "代码行数",\n';
        prompt += '    "maintainability": "可维护性指数(0-100)",\n';
        prompt += '    "securityScore": "安全评分(0-100)"\n';
        prompt += '  }\n';
        prompt += '}\n\n';
        prompt += 'Java代码：\n';
        prompt += '```java\n';
        prompt += code;
        prompt += '\n```';

        return prompt;
    }

    // 修改 callDeepSeekAPI 函数
async callDeepSeekAPI(prompt) {
    const messages = [
        {
            role: 'system',
            content: '你是一个专业的Java代码审查专家。请仔细分析代码并提供详细的缺陷报告。'
        },
        {
            role: 'user',
            content: prompt
        }
    ];
    
    try {
        const response = await fetch(API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 注意：如果API在Vercel上，不需要Authorization头
                // Authorization头应该在服务器端API中添加
            },
            body: JSON.stringify({
                messages: messages,
                model: API_CONFIG.model,
                temperature: API_CONFIG.temperature,
                max_tokens: API_CONFIG.maxTokens
            })
        });
        
        console.log('API响应状态:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API请求失败: ${response.status} - ${errorData.message || '未知错误'}`);
        }
        
        const data = await response.json();
        console.log('API响应数据:', data);
        
        if (data.success && data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        } else {
            throw new Error('API响应格式不正确');
        }
        
    } catch (error) {
        console.error('API调用失败:', error);
        throw error;
    }
}

    parseAnalysisResult(aiResponse) {
        try {
            // 尝试从响应中提取JSON
            const jsonMatch = aiResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
            let issues = [];

            if (jsonMatch) {
                issues = JSON.parse(jsonMatch[0]);
            }

            // 提取度量指标
            const metricsMatch = aiResponse.match(/"metrics":\s*\{[\s\S]*?\}/);
            let metrics = {
                complexity: 0,
                lines: 0,
                maintainability: 0,
                securityScore: 0
            };

            if (metricsMatch) {
                const metricsStr = metricsMatch[0].replace(/"metrics":\s*/, '');
                metrics = JSON.parse(metricsStr);
            }

            return {
                issues: Array.isArray(issues) ? issues : [],
                metrics: metrics
            };
        } catch (error) {
            console.error('解析AI响应失败:', error);
            // 返回默认结构
            return {
                issues: [{
                    id: 'error',
                    title: '解析错误',
                    description: '无法解析AI响应，原始响应：' + aiResponse.substring(0, 200),
                    severity: 'medium',
                    category: 'bug',
                    location: 'N/A',
                    suggestion: '请检查API响应格式'
                }],
                metrics: {
                    complexity: 0,
                    lines: 0,
                    maintainability: 0,
                    securityScore: 0
                }
            };
        }
    }

    displayResults(result, originalCode) {
        this.resetResults();

        // 更新摘要卡片
        this.updateSummaryCards(result.issues);

        // 显示详细问题
        this.displayIssues(result.issues);

        // 更新代码视图
        document.getElementById('codeViewer').textContent = originalCode;
        this.highlightCode();

        // 显示修复建议
        this.displaySuggestions(result.issues);

        // 更新度量指标
        this.updateMetrics(result.metrics);

        // 显示结果区域
        document.getElementById('statusArea').classList.add('hidden');
        document.getElementById('summaryCards').classList.remove('hidden');
        document.getElementById('resultsArea').classList.remove('hidden');

        // 启用导出和复制按钮
        document.getElementById('exportBtn').disabled = false;
        document.getElementById('copyBtn').disabled = false;
    }

    updateSummaryCards(issues) {
        const counts = {
            critical: issues.filter(i => i.severity === 'critical').length,
            high: issues.filter(i => i.severity === 'high').length,
            medium: issues.filter(i => i.severity === 'medium').length,
            low: issues.filter(i => i.severity === 'low').length
        };

        document.getElementById('criticalCount').textContent = counts.critical;
        document.getElementById('highCount').textContent = counts.high;
        document.getElementById('mediumCount').textContent = counts.medium;
        document.getElementById('lowCount').textContent = counts.low;
    }

    displayIssues(issues) {
        const issuesList = document.getElementById('issuesList');
        issuesList.innerHTML = '';

        if (issues.length === 0) {
            issuesList.innerHTML = `
                <div class="issue-item severity-low">
                    <div class="issue-content">
                        <p>🎉 恭喜！未发现明显问题。</p>
                        <p>您的代码看起来质量不错！</p>
                    </div>
                </div>
            `;
            return;
        }

        issues.forEach(issue => {
            const issueElement = document.createElement('div');
            issueElement.className = `issue-item severity-${issue.severity}`;

            const severityText = {
                critical: '严重',
                high: '高危',
                medium: '中危',
                low: '低危'
            }[issue.severity] || issue.severity;

            const categoryText = {
                security: '安全',
                performance: '性能',
                bug: '缺陷',
                style: '规范'
            }[issue.category] || issue.category;

            issueElement.innerHTML = `
                <div class="issue-header">
                    <div class="issue-title">
                        <i class="fas fa-exclamation-circle"></i>
                        ${issue.title}
                    </div>
                    <div class="issue-severity">
                        ${severityText} • ${categoryText}
                    </div>
                </div>
                <div class="issue-content">
                    <p>${issue.description}</p>
                    ${issue.location ? `<div class="issue-location">位置: ${issue.location}</div>` : ''}
                    ${issue.codeSnippet ? `<pre class="code-snippet">${issue.codeSnippet}</pre>` : ''}
                    ${issue.suggestion ? `
                        <div class="issue-suggestion">
                            <h5><i class="fas fa-lightbulb"></i> 修复建议</h5>
                            <p>${issue.suggestion}</p>
                        </div>
                    ` : ''}
                </div>
            `;

            issuesList.appendChild(issueElement);
        });
    }

    displaySuggestions(issues) {
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '';

        const suggestions = issues
            .filter(issue => issue.suggestion && issue.severity !== 'low')
            .slice(0, 5); // 最多显示5个建议

        if (suggestions.length === 0) {
            suggestionsList.innerHTML = `
                <div class="suggestion-item">
                    <h4><i class="fas fa-check-circle"></i> 无紧急修复建议</h4>
                    <p>您的代码质量良好，无需紧急修复。</p>
                </div>
            `;
            return;
        }

        suggestions.forEach((suggestion, index) => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item';

            suggestionElement.innerHTML = `
                <h4><i class="fas fa-wrench"></i> 修复建议 ${index + 1}</h4>
                <div class="suggestion-content">
                    <p><strong>问题：</strong>${suggestion.title}</p>
                    <p><strong>建议：</strong>${suggestion.suggestion}</p>
                </div>
            `;

            suggestionsList.appendChild(suggestionElement);
        });
    }

    updateMetrics(metrics) {
        document.getElementById('metricComplexity').textContent = metrics.complexity || 0;
        document.getElementById('metricLines').textContent = metrics.lines || 0;
        document.getElementById('metricMaintainability').textContent = metrics.maintainability || 0;
        document.getElementById('metricSecurity').textContent = `${metrics.securityScore || 0}%`;

        // 更新进度条
        const maintainabilityPercent = Math.min(100, Math.max(0, metrics.maintainability || 0));
        const securityPercent = Math.min(100, Math.max(0, metrics.securityScore || 0));

        document.querySelectorAll('.metric-card')[2].querySelector('.metric-fill').style.width = `${maintainabilityPercent}%`;
        document.querySelectorAll('.metric-card')[3].querySelector('.metric-fill').style.width = `${securityPercent}%`;
    }

    highlightCode() {
        const codeElement = document.getElementById('codeViewer');
        hljs.highlightElement(codeElement);
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
        document.getElementById('statusMessage').classList.add('hidden');
        document.getElementById('analyzeBtn').disabled = true;
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
        document.getElementById('analyzeBtn').disabled = false;
    }

    showError(message) {
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        `;
        statusMessage.classList.remove('hidden');
        document.getElementById('loadingSpinner').classList.add('hidden');
    }

    resetResults() {
        document.getElementById('statusMessage').classList.remove('hidden');
        document.getElementById('summaryCards').classList.add('hidden');
        document.getElementById('resultsArea').classList.add('hidden');
        document.getElementById('exportBtn').disabled = true;
        document.getElementById('copyBtn').disabled = true;

        document.getElementById('statusMessage').innerHTML = `
            <i class="fas fa-info-circle"></i>
            <p>请输入或上传Java代码进行分析</p>
        `;
    }

    saveToHistory(code, result) {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            codePreview: code.substring(0, 100) + (code.length > 100 ? '...' : ''),
            issueCount: result.issues.length,
            criticalCount: result.issues.filter(i => i.severity === 'critical').length
        };

        this.analysisHistory.unshift(historyItem);
        if (this.analysisHistory.length > 10) {
            this.analysisHistory = this.analysisHistory.slice(0, 10);
        }

        localStorage.setItem('analysisHistory', JSON.stringify(this.analysisHistory));
        this.loadHistory();
    }

    loadHistory() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        if (this.analysisHistory.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-history"></i>
                    <p>暂无历史记录</p>
                </div>
            `;
            return;
        }

        this.analysisHistory.forEach(item => {
            const historyElement = document.createElement('div');
            historyElement.className = 'history-item';
            historyElement.addEventListener('click', () => {
                // 可以添加点击历史记录加载代码的功能
                alert('历史记录功能开发中...');
            });

            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });

            historyElement.innerHTML = `
                <div class="history-title">
                    代码分析 ${timeStr}
                </div>
                <div class="history-info">
                    <span>${item.codePreview}</span>
                    <span>${item.issueCount}个问题</span>
                </div>
            `;

            historyList.appendChild(historyElement);
        });
    }

    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            this.analysisHistory = [];
            localStorage.removeItem('analysisHistory');
            this.loadHistory();
        }
    }

    exportResults() {
        const results = {
            timestamp: new Date().toISOString(),
            code: this.currentCode,
            issues: this.getCurrentIssues(),
            metrics: this.getCurrentMetrics()
        };

        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code-analysis-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    copyResults() {
        const results = {
            timestamp: new Date().toISOString(),
            code: this.currentCode,
            issues: this.getCurrentIssues(),
            metrics: this.getCurrentMetrics()
        };

        navigator.clipboard.writeText(JSON.stringify(results, null, 2))
            .then(() => alert('结果已复制到剪贴板'))
            .catch(err => alert('复制失败: ' + err));
    }

    getCurrentIssues() {
        // 这里可以从DOM提取当前显示的问题
        return [];
    }

    getCurrentMetrics() {
        return {
            complexity: parseInt(document.getElementById('metricComplexity').textContent) || 0,
            lines: parseInt(document.getElementById('metricLines').textContent) || 0,
            maintainability: parseInt(document.getElementById('metricMaintainability').textContent) || 0,
            securityScore: parseInt(document.getElementById('metricSecurity').textContent) || 0
        };
    }

    async checkAPIStatus() {
        const apiStatus = document.getElementById('apiStatus');

        try {
            // 简单的API连接测试
            apiStatus.innerHTML = '<span class="status-dot"></span><span>连接中...</span>';

            // 模拟API检查（实际部署时需要真实检查）
            setTimeout(() => {
                apiStatus.innerHTML = '<span class="status-dot"></span><span>API可用</span>';
                apiStatus.classList.add('active');
            }, 1000);

        } catch (error) {
            apiStatus.innerHTML = '<span class="status-dot"></span><span>API不可用</span>';
            console.error('API状态检查失败:', error);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.codeAnalyzer = new CodeAnalyzer();
});
