document.addEventListener('DOMContentLoaded', function () {
    const codeInput = document.getElementById('codeInput');
    const fileUpload = document.getElementById('fileUpload');
    const fileName = document.getElementById('fileName');
    const exampleBtn = document.getElementById('exampleBtn');
    const clearBtn = document.getElementById('clearBtn');
    const checkBtn = document.getElementById('checkBtn');
    const copyBtn = document.getElementById('copyBtn');
    const loading = document.getElementById('loading');
    const resultOutput = document.getElementById('resultOutput');

    // 示例代码
    const exampleCode = `import java.util.Scanner;

public class UserAuth {
    private Map<String, String> users = new HashMap<>();
    
    public boolean authenticate(String username, String password) {
        // 安全问题：密码直接比较
        String storedPassword = users.get(username);
        return storedPassword != null && storedPassword.equals(password);
    }
    
    public void processUserInput() {
        Scanner scanner = new Scanner(System.in);
        System.out.print("请输入年龄: ");
        // 未验证输入
        int age = scanner.nextInt();
        
        // 潜在的空指针异常
        String[] names = null;
        System.out.println("第一个名字: " + names[0]);
        
        // 资源未关闭
        // scanner.close(); // 忘记关闭
    }
    
    // 性能问题：重复计算
    public void calculate(int n) {
        for (int i = 0; i < n; i++) {
            double result = Math.sqrt(i) * Math.pow(i, 2);
        }
        for (int i = 0; i < n; i++) {
            double result = Math.sqrt(i) * Math.pow(i, 2); // 重复计算
        }
    }
}`;

    // 文件上传处理
    fileUpload.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            fileName.textContent = file.name;
            const reader = new FileReader();
            reader.onload = function (e) {
                codeInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    });

    // 示例按钮
    exampleBtn.addEventListener('click', function () {
        codeInput.value = exampleCode;
        fileName.textContent = '示例代码.java';
        resultOutput.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-chart-line"></i>
                <p>已加载示例代码</p>
                <p class="hint">点击"检查代码缺陷"按钮开始分析</p>
            </div>
        `;
    });

    // 清空按钮
    clearBtn.addEventListener('click', function () {
        codeInput.value = '';
        fileName.textContent = '未选择文件';
        fileUpload.value = '';
        resultOutput.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-chart-line"></i>
                <p>分析结果将显示在这里</p>
                <p class="hint">点击上方"检查代码缺陷"按钮开始分析</p>
            </div>
        `;
        copyBtn.disabled = true;
    });

    // 检查代码缺陷
    checkBtn.addEventListener('click', async function () {
        const code = codeInput.value.trim();

        if (!code) {
            alert('请输入Java代码');
            return;
        }

        // 显示加载状态
        loading.style.display = 'flex';
        checkBtn.disabled = true;
        resultOutput.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>正在分析代码，这可能需要一些时间...</p>
            </div>
        `;

        try {
            const response = await fetch('/api/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '分析失败');
            }

            displayResults(data);
            copyBtn.disabled = false;

        } catch (error) {
            resultOutput.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>分析失败</h3>
                    <p>${error.message}</p>
                    <p class="hint">请检查网络连接或稍后重试</p>
                </div>
            `;
        } finally {
            loading.style.display = 'none';
            checkBtn.disabled = false;
        }
    });

    // 复制结果
    copyBtn.addEventListener('click', function () {
        const text = resultOutput.innerText;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        });
    });

    // 显示分析结果
    function displayResults(data) {
        const result = data.result;

        // 如果是JSON格式的响应
        if (result && typeof result === 'string') {
            try {
                // 尝试解析为JSON
                const parsed = JSON.parse(result);
                if (parsed.issues) {
                    displayStructuredResults(parsed);
                    return;
                }
            } catch {
                // 如果不是JSON，直接显示文本
            }
        }

        // 显示文本结果
        resultOutput.innerHTML = `
            <div class="text-result">
                <div class="result-header">
                    <h3><i class="fas fa-clipboard-check"></i> 分析完成</h3>
                    <span class="timestamp">${new Date().toLocaleString()}</span>
                </div>
                <div class="result-content">
                    <pre>${escapeHtml(result)}</pre>
                </div>
            </div>
        `;
    }

    // 显示结构化结果
    function displayStructuredResults(data) {
        let html = `
            <div class="result-header">
                <h3><i class="fas fa-clipboard-check"></i> 代码分析报告</h3>
                <div class="summary">
                    <span class="summary-item">
                        <i class="fas fa-exclamation-circle text-danger"></i>
                        严重问题: ${data.summary?.critical || 0}
                    </span>
                    <span class="summary-item">
                        <i class="fas fa-exclamation-triangle text-warning"></i>
                        警告: ${data.summary?.warnings || 0}
                    </span>
                    <span class="summary-item">
                        <i class="fas fa-info-circle text-info"></i>
                        建议: ${data.summary?.suggestions || 0}
                    </span>
                </div>
            </div>
        `;

        data.issues.forEach((issue, index) => {
            const severityClass = getSeverityClass(issue.severity);
            const severityText = getSeverityText(issue.severity);

            html += `
                <div class="issue-item ${severityClass}">
                    <div class="issue-header">
                        <div class="issue-title">
                            <i class="fas fa-${getIssueIcon(issue.type)}"></i>
                            ${issue.title || `问题 ${index + 1}`}
                        </div>
                        <span class="issue-severity severity-${issue.severity}">
                            ${severityText}
                        </span>
                    </div>
                    <div class="issue-content">
                        <p><strong>位置:</strong> ${issue.location || '未指定'}</p>
                        <p><strong>描述:</strong> ${issue.description}</p>
                    </div>
                    ${issue.solution ? `
                        <div class="issue-solution">
                            <h4><i class="fas fa-lightbulb"></i> 解决方案</h4>
                            <p>${issue.solution}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        resultOutput.innerHTML = html;
    }

    // 辅助函数
    function getSeverityClass(severity) {
        const map = {
            'high': 'error',
            'critical': 'error',
            'medium': 'warning',
            'low': 'info'
        };
        return map[severity] || 'info';
    }

    function getSeverityText(severity) {
        const map = {
            'high': '严重',
            'critical': '严重',
            'medium': '中等',
            'low': '低'
        };
        return map[severity] || '信息';
    }

    function getIssueIcon(type) {
        const map = {
            'security': 'shield-alt',
            'performance': 'tachometer-alt',
            'memory': 'memory',
            'null-pointer': 'exclamation-circle',
            'resource': 'plug',
            'concurrency': 'sync',
            'code-smell': 'code',
            'best-practice': 'star'
        };
        return map[type] || 'bug';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 初始化
    resultOutput.innerHTML = `
        <div class="placeholder">
            <i class="fas fa-chart-line"></i>
            <p>分析结果将显示在这里</p>
            <p class="hint">点击上方"检查代码缺陷"按钮开始分析</p>
        </div>
    `;
});