document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('api-key-modal');
    const chatContainer = document.getElementById('chat-container');
    const providerSelect = document.getElementById('provider-select');
    const apiKeyInput = document.getElementById('api-key-input');
    const submitKey = document.getElementById('submit-key');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const emojiBar = document.getElementById('emoji-bar');
    const quickReplies = document.getElementById('quick-replies');
    const providerName = document.getElementById('provider-name');
    const confettiCanvas = document.getElementById('confetti-canvas');

    let apiKey = '';
    let provider = '';

    submitKey.addEventListener('click', () => {
        apiKey = apiKeyInput.value.trim();
        provider = providerSelect.value;
        if (apiKey) {
            modal.classList.add('hidden');
            chatContainer.classList.remove('hidden');
            providerName.textContent = providerSelect.options[providerSelect.selectedIndex].text;
            addSystemMessage(`Hi! I'm Steve AI. Try asking about redstone, builds, or crafting. ${String.fromCodePoint(0x1F47E)}`);
            renderQuickReplies(['Best redstone elevator','Nether gate tips','Automatic farm']);
        } else {
            alert('Please enter a valid API key.');
        }
    });

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        addMessage('user', message);
        messageInput.value = '';

        // Show typing indicator
        const typingRow = createMessageRow('ai', 'Steve AI is typing...', true);
        chatMessages.appendChild(typingRow);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Call AI API
        callAI(message).then(response => {
            if (typingRow && typingRow.parentNode) typingRow.parentNode.removeChild(typingRow);
            addMessage('ai', response);
            // small celebratory confetti when keywords appear
            if (/congrat|nice|gg|well done|celebrat/i.test(response) || /celebrate|yay|party/i.test(message)) {
                runConfetti();
            }
        }).catch(error => {
            if (typingRow && typingRow.parentNode) typingRow.parentNode.removeChild(typingRow);
            addMessage('ai', 'Sorry, I encountered an error. Please try again.');
            console.error(error);
        });
    }

    function addSystemMessage(text){
        const row = createMessageRow('ai', text, false, true);
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addMessage(sender, text) {
        const row = createMessageRow(sender, text);
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        // populate quick replies from short answers
        if (sender === 'ai') renderQuickReplies(suggestReplies(text));
    }

    function createMessageRow(sender, text, isTyping=false, isSystem=false){
        const row = document.createElement('div');
        row.className = `message-row ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '🙂' : '🧠';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;
        if (isTyping) bubble.classList.add('typing');
        if (isSystem) bubble.style.opacity = 0.9;

        row.appendChild(avatar);
        row.appendChild(bubble);
        return row;
    }

    async function callAI(userMessage) {
        const systemPrompt = "You are Steve AI, an expert on Minecraft. Provide helpful, accurate information about Minecraft gameplay, crafting, redstone, building, and more. Keep responses friendly and engaging.";

        if (provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage }
                    ]
                })
            });
            const data = await response.json();
            if (response.ok) {
                return data.choices[0].message.content;
            } else {
                throw new Error(data.error.message);
            }
        } else if (provider === 'anthropic') {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    system: systemPrompt,
                    messages: [
                        { role: 'user', content: userMessage }
                    ]
                })
            });
            const data = await response.json();
            if (response.ok) {
                return data.content[0].text;
            } else {
                throw new Error(data.error.message);
            }
        } else {
            throw new Error('Unsupported provider');
        }
    }

    // Emoji bar
    emojiBar && emojiBar.addEventListener('click', (e)=>{
        if(e.target.classList.contains('emoji-btn')){
            messageInput.value = (messageInput.value + ' ' + e.target.textContent).trim();
            messageInput.focus();
        }
    });

    // Quick replies
    function renderQuickReplies(list){
        quickReplies.innerHTML = '';
        if(!list || list.length===0) return;
        list.forEach(t=>{
            const chip = document.createElement('button');
            chip.className='chip';
            chip.textContent = t;
            chip.addEventListener('click', ()=>{ messageInput.value = t; sendMessage(); });
            quickReplies.appendChild(chip);
        });
    }

    function suggestReplies(text){
        // naive suggestions based on keywords
        const s = text.toLowerCase();
        if(s.includes('redstone')) return ['Compact piston door','Item elevator tutorial','Redstone clock'];
        if(s.includes('nether')) return ['Nether portal tips','Best nether farm','Blaze farm guide'];
        return ['How to build a base','Best seeds 1.20','Farming tips'];
    }

    // Minimal confetti: falling emoji particles
    function runConfetti(){
        if(!confettiCanvas) return;
        const ctx = confettiCanvas.getContext('2d');
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        const particles = [];
        const emojis = ['✨','🎉','🎊','🪄','⛏️'];
        for(let i=0;i<40;i++){
            particles.push({x:Math.random()*confettiCanvas.width,y:Math.random()*-200,vy:1+Math.random()*3,emoji:emojis[Math.floor(Math.random()*emojis.length)],size:12+Math.random()*18,rot:Math.random()*360});
        }
        let t=0;
        function frame(){
            t++; ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
            particles.forEach(p=>{
                p.y += p.vy; p.x += Math.sin((t+p.x)/20);
                ctx.font = `${p.size}px serif`;
                ctx.fillText(p.emoji, p.x, p.y);
            });
            if(t<160) requestAnimationFrame(frame);
            else ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
        }
        frame();
    }
});