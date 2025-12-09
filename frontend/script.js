class ChatApp {
    constructor() {
        this.apiUrl = 'http://10.105.165.32:8000/api/chat';
        this.messages = [];
        this.conversationId = null;

        this.initElements();
        this.initEventListeners();
        this.loadConversation();
        this.checkHealth();
    }

    initElements() {
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.messagesContainer = document.getElementById('messages-container');
        this.clearButton = document.getElementById('clear-chat');
        this.loadingElement = document.getElementById('loading');
        this.temperatureSlider = document.getElementById('temperature');
        this.tempValue = document.getElementById('temp-value');
    }

    initEventListeners() {
        // 发送消息
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 清空对话
        this.clearButton.addEventListener('click', () => this.clearConversation());

        // 温度调节
        this.temperatureSlider.addEventListener('input', (e) => {
            this.tempValue.textContent = e.target.value;
        });
    }

    async checkHealth() {
        try {
            const response = await fetch('http://localhost:8000/api/health');
            if (response.ok) {
                this.updateStatus('在线', '#4CAF50');
            }
        } catch (error) {
            this.updateStatus('离线', '#ff6b6b');
            console.error('服务不可用:', error);
        }
    }

    updateStatus(text, color) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = text;
        statusElement.style.color = color;
    }

    async sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content) return;

        // 添加用户消息
        this.addMessage('user', content);
        this.messageInput.value = '';

        // 显示加载动画
        this.showLoading(true);

        try {
            // 准备请求数据
            const requestData = {
                messages: this.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                temperature: parseFloat(this.temperatureSlider.value)
            };

            // 发送请求
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const data = await response.json();

            // 添加助手回复
            this.addMessage('assistant', data.message.content);

            // 保存对话
            this.saveConversation();

        } catch (error) {
            console.error('发送消息失败:', error);
            this.addMessage('assistant',
                '哎呀，康康刚才走神了一下下(＞﹏＜)，能再问一次吗？'
            );
        } finally {
            this.showLoading(false);
        }
    }

    addMessage(role, content) {
        const message = {
            role,
            content,
            timestamp: new Date().toLocaleTimeString()
        };

        this.messages.push(message);
        this.renderMessage(message);
    }

    renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role === 'user' ? 'user' : 'system'}`;

        const avatar = message.role === 'user' ? '🐇' : '🤖';

        messageElement.innerHTML = `
            <div class="avatar">${avatar}</div>
            <div class="bubble">
                <p>${this.formatContent(message.content)}</p>
                <span class="time">${message.timestamp}</span>
            </div>
        `;

        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    formatContent(content) {
        // 将换行符转换为<br>
        return content.replace(/\n/g, '<br>');
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showLoading(show) {
        this.loadingElement.style.display = show ? 'flex' : 'none';
        this.sendButton.disabled = show;
    }

    saveConversation() {
        localStorage.setItem('kangkang_conversation', JSON.stringify({
            messages: this.messages,
            conversationId: this.conversationId,
            timestamp: new Date().toISOString()
        }));
    }

    loadConversation() {
        const saved = localStorage.getItem('kangkang_conversation');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.messages = data.messages || [];
                this.conversationId = data.conversationId;

                // 重新渲染历史消息
                this.messagesContainer.innerHTML = '';
                this.messages.forEach(msg => this.renderMessage(msg));
            } catch (error) {
                console.error('加载对话历史失败:', error);
            }
        }
    }

    clearConversation() {
        if (confirm('确定要清空对话历史吗？(；′⌒`)')) {
            this.messages = [];
            this.conversationId = null;
            localStorage.removeItem('kangkang_conversation');

            // 清空消息容器
            this.messagesContainer.innerHTML = '';

            // 添加系统欢迎消息
            this.addMessage('assistant',
                '乖宝，我是康康1号机 (｡･ω･｡)ﾉ♡<br>今天有什么想聊的吗？康康会一直陪着你哦~'
            );
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});