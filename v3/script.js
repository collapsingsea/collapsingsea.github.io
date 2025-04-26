// script.js (Complete Code - 3-Column Resizable Layout, Auto-Send, Responsive)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    // Center Area
    const chatLog = document.getElementById('chat-log');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const imagePreviewArea = document.getElementById('image-preview-area');
    const uploadButton = document.getElementById('upload-button');
    const imageUploadInput = document.getElementById('image-upload-input');
    const chatHeaderTitle = document.getElementById('chat-header-title');
    const centerContent = document.getElementById('center-content'); // Center column div
    // Left Sidebar
    const historySidebar = document.getElementById('history-sidebar'); // Left sidebar div
    const newChatButton = document.getElementById('new-chat-button');
    const chatListUl = document.getElementById('chat-list');
    // Right Sidebar
    const settingsSidebar = document.getElementById('settings-sidebar'); // Right sidebar div
    const modelSelector = document.getElementById('model-selector');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveKeyButton = document.getElementById('save-key-button');
    const systemInstructionInput = document.getElementById('system-instruction-input');
    const temperatureSlider = document.getElementById('temperature-slider');
    const temperatureValueSpan = document.getElementById('temperature-value');
    const topPSlider = document.getElementById('topp-slider');
    const topPValueSpan = document.getElementById('topp-value');
    const topKInput = document.getElementById('topk-input');
    const maxTokensInput = document.getElementById('max-tokens-input');
    const searchToggle = document.getElementById('search-toggle');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    // Auto-Send Elements
    const autoSendInput = document.getElementById('auto-send-input');
    const autoSendIntervalInput = document.getElementById('auto-send-interval');
    const autoSendButton = document.getElementById('auto-send-button');
    // Resizers
    const resizerLeft = document.getElementById('resizer-left');
    const resizerRight = document.getElementById('resizer-right');
    // Mobile Toggles
    const toggleHistoryButton = document.getElementById('toggle-history-button');
    const toggleSettingsButton = document.getElementById('toggle-settings-button');
    const appWrapper = document.querySelector('.app-wrapper'); // Need wrapper for overlay

    // --- Model Definitions ---
    const availableModels = [
        { id: 'gemini-2.5-pro-preview-03-25', name: 'Gemini 2.5 Pro Preview', type: 'gemini_generate' },
        { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash Preview', type: 'gemini_generate' },
        { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', type: 'gemini_generate' },
        { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash', type: 'gemini_generate' },
        { id: 'gemini-2.0-flash-exp-image-generation', name: 'Gemini 2.0 Flash (Image Gen)', type: 'gemini_image_generate' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', type: 'gemini_generate' }
    ];

    // --- Constants ---
    const CHAT_HISTORY_STORAGE_KEY = 'geminiWebChatHistories_v2';
    const ACTIVE_CHAT_ID_KEY = 'geminiWebChatActiveId_v2';
    const DARK_MODE_KEY = 'darkModeEnabled_v1';
    const LAYOUT_WIDTH_LEFT_KEY = 'layoutWidthLeft_v1';
    const LAYOUT_WIDTH_RIGHT_KEY = 'layoutWidthRight_v1';
    const MIN_SIDEBAR_WIDTH = 200; // Minimum pixels for sidebars
    const MIN_CENTER_WIDTH = 300; // Minimum pixels for center

    // --- Configuration & State ---
    let API_KEY = localStorage.getItem('googleAiApiKey') || '';
    let currentModelId = localStorage.getItem('selectedGoogleAiModel');
    if (!availableModels.some(m => m.id === currentModelId)) { currentModelId = availableModels[0]?.id || ''; if (currentModelId) localStorage.setItem('selectedGoogleAiModel', currentModelId); }
    const DEFAULT_SETTINGS = { systemInstruction: '', temperature: 1.0, topP: 1.0, topK: 0, maxOutputTokens: null, searchEnabled: false };
    let currentSettings = {
        systemInstruction: localStorage.getItem('googleAiSystemInstruction') || DEFAULT_SETTINGS.systemInstruction,
        temperature: parseFloat(localStorage.getItem('googleAiTemperature') ?? DEFAULT_SETTINGS.temperature),
        topP: parseFloat(localStorage.getItem('googleAiTopP') ?? DEFAULT_SETTINGS.topP),
        topK: parseInt(localStorage.getItem('googleAiTopK') ?? DEFAULT_SETTINGS.topK, 10),
        maxOutputTokens: parseInt(localStorage.getItem('googleAiMaxTokens') ?? '', 10) || DEFAULT_SETTINGS.maxOutputTokens,
        searchEnabled: localStorage.getItem('googleAiSearchEnabled') === 'true' ?? DEFAULT_SETTINGS.searchEnabled,
    };
    let allChats = [];
    let currentChatId = null;
    let conversationHistory = []; // Points to current chat's history
    let uploadedFilesData = [];
    let isDarkMode = false;
    let autoSendIntervalId = null;
    let isAutoSending = false;
    // Mobile Sidebar State
    let isHistorySidebarOpen = false;
    let isSettingsSidebarOpen = false;
    let overlay = null; // Overlay element

    // --- Initialization ---
    function initializeUI() {
        // Populate Model Selector
        modelSelector.innerHTML = '';
        availableModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            modelSelector.appendChild(option);
        });
        if (availableModels.some(m => m.id === currentModelId)) {
             modelSelector.value = currentModelId;
        } else if (availableModels.length > 0) {
             currentModelId = availableModels[0].id;
             modelSelector.value = currentModelId;
             localStorage.setItem('selectedGoogleAiModel', currentModelId);
        }
        console.log(`Initialized with model: ${currentModelId}`);

        // API Key
        apiKeyInput.value = API_KEY;

        // Settings UI
        systemInstructionInput.value = currentSettings.systemInstruction;
        temperatureSlider.value = currentSettings.temperature;
        temperatureValueSpan.textContent = currentSettings.temperature.toFixed(1);
        topPSlider.value = currentSettings.topP;
        topPValueSpan.textContent = currentSettings.topP.toFixed(2);
        topKInput.value = currentSettings.topK > 0 ? currentSettings.topK : '';
        maxTokensInput.value = currentSettings.maxOutputTokens || '';
        searchToggle.checked = currentSettings.searchEnabled;

        console.log("Initialized Settings:", currentSettings);

        // Load and apply theme preference
        loadThemePreference();
    }

    // --- Theme Management ---
    function applyTheme(isDark) {
        isDarkMode = isDark;
        darkModeToggle.checked = isDark;
        document.body.classList.toggle('dark-mode', isDark);
        console.log(`Theme applied: ${isDark ? 'Dark' : 'Light'}`);
    }

    function loadThemePreference() {
        const savedPreference = localStorage.getItem(DARK_MODE_KEY);
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        const initialDarkMode = savedPreference !== null ? (savedPreference === 'true') : (prefersDark ?? false);
        applyTheme(initialDarkMode);
    }

    function saveThemePreference() {
        localStorage.setItem(DARK_MODE_KEY, isDarkMode);
    }

    // --- Chat History Management ---
    function loadChats() {
        try {
            const storedChats = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
            allChats = storedChats ? JSON.parse(storedChats) : [];
            // Ensure history array exists for each chat
            allChats.forEach(chat => { if (!chat.history) chat.history = []; });
            allChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            currentChatId = localStorage.getItem(ACTIVE_CHAT_ID_KEY);
            if (!allChats.some(chat => chat.id === currentChatId)) {
                currentChatId = allChats[0]?.id || null;
                if (currentChatId) localStorage.setItem(ACTIVE_CHAT_ID_KEY, currentChatId);
                else localStorage.removeItem(ACTIVE_CHAT_ID_KEY);
            }
            console.log(`Loaded ${allChats.length} chats. Active ID: ${currentChatId}`);
        } catch (error) {
            console.error("Error loading chat history:", error);
            allChats = []; currentChatId = null;
            localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
            localStorage.removeItem(ACTIVE_CHAT_ID_KEY);
        }
    }

    function saveChats() {
        try {
            const currentChat = allChats.find(chat => chat.id === currentChatId);
            if (currentChat) currentChat.timestamp = Date.now();
            allChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Keep sorted by date
            localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(allChats));
            if (currentChatId) localStorage.setItem(ACTIVE_CHAT_ID_KEY, currentChatId);
            else localStorage.removeItem(ACTIVE_CHAT_ID_KEY);
        } catch (error) {
            console.error("Error saving chat history:", error);
        }
    }

    function renderChatList() {
        chatListUl.innerHTML = '';
        allChats.forEach(chat => {
            const li = document.createElement('li');
            li.textContent = chat.title || 'Untitled Chat';
            li.dataset.chatId = chat.id;
            li.title = chat.title || 'Untitled Chat';
            if (chat.id === currentChatId) li.classList.add('active');
            li.addEventListener('click', () => { if (chat.id !== currentChatId) switchChat(chat.id); });

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-chat-button');
            deleteBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: inherit;">delete</span>`;
            deleteBtn.title = '删除对话';
            deleteBtn.addEventListener('click', (event) => { event.stopPropagation(); deleteChat(chat.id); });
            li.appendChild(deleteBtn);
            chatListUl.appendChild(li);
        });
    }

    function renderChatLog(history) {
        chatLog.innerHTML = '';
        if (!history || history.length === 0) {
             addMessage('ai', 'hiiiiiiiiiiii!'); // Welcome for empty chat
             return;
        }
        // Make sure history is actually an array before iterating
        if (Array.isArray(history)) {
            history.forEach(turn => addMessage(turn.role === 'model' ? 'ai' : 'user', turn.parts));
        } else {
            console.error("Invalid history format passed to renderChatLog:", history);
             addMessage('ai', '错误：无法加载对话记录。');
        }
        requestAnimationFrame(() => { chatLog.scrollTop = chatLog.scrollHeight; });
    }

    function switchChat(chatId) {
        console.log("Switching to chat:", chatId);
        stopAutoSend(); // Stop auto-send when switching
        closeSidebars(); // Close mobile sidebars when switching
        const chat = allChats.find(c => c.id === chatId);
        if (!chat) {
            console.error("Chat not found:", chatId);
            startNewChat(); // Fallback to new chat if ID is invalid
            return;
        }
        // Ensure the chat has a history array
        if (!chat.history) {
             chat.history = [];
             console.warn("Chat found but missing history array, initialized.");
        }

        currentChatId = chatId;
        conversationHistory = chat.history; // Point to the history of the selected chat
        chatHeaderTitle.textContent = chat.title || 'AI 对话'; // Update header title

        renderChatLog(conversationHistory); // Render the messages for this chat
        renderChatList(); // Update highlighting in the sidebar list
        saveChats(); // Save the new active chat ID

        imagePreviewArea.innerHTML = ''; // Clear image previews
        uploadedFilesData = [];

        userInput.focus();
    }

    function startNewChat() {
        console.log("Starting new chat...");
        stopAutoSend(); // Stop auto-send
        closeSidebars(); // Close mobile sidebars
        const newId = Date.now().toString();
        const newChat = {
            id: newId,
            title: "新对话",
            history: [], // Initialize with empty history array
            timestamp: Date.now()
        };

        allChats.unshift(newChat); // Add to the beginning
        currentChatId = newId;
        conversationHistory = newChat.history; // Point to the new empty history
        chatHeaderTitle.textContent = newChat.title; // Update header

        renderChatLog(conversationHistory); // Render the empty log (shows welcome message)
        renderChatList(); // Add the new chat to the list and highlight it
        saveChats(); // Save the new chat and active ID

        imagePreviewArea.innerHTML = ''; // Clear previews
        uploadedFilesData = [];
        userInput.focus();
    }

     function deleteChat(chatId) {
         const chatToDelete = allChats.find(c => c.id === chatId);
         if (!chatToDelete || !confirm(`确定要删除对话 "${chatToDelete.title || 'Untitled Chat'}" 吗？`)) {
             return;
         }
         console.log("Deleting chat:", chatId);
         stopAutoSend(); // Stop auto-send if active chat is deleted

         const indexToDelete = allChats.findIndex(c => c.id === chatId);
         if (indexToDelete > -1) {
             allChats.splice(indexToDelete, 1); // Remove from array

             if (chatId === currentChatId) {
                 currentChatId = null; // Reset current ID
                 const nextChatId = allChats[0]?.id || null; // Try to switch to the new first chat
                 if (nextChatId) {
                     switchChat(nextChatId); // Switch to the next available chat
                 } else {
                     startNewChat(); // If no chats left, start a new one
                 }
             } else {
                // If deleted chat was not active, just save and re-render list
                 saveChats();
                 renderChatList();
             }
         }
     }

     function generateChatTitle(userMessage, currentTitle) {
         if (currentTitle && !currentTitle.toLowerCase().includes("新对话") && !currentTitle.toLowerCase().includes("new chat")) {
             return currentTitle; // Keep existing non-default title
         }
         const words = userMessage.split(' ');
         return words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
     }


    // --- Helper Functions ---
    function escapeHtml(unsafe) { if (typeof unsafe !== 'string') return unsafe; return unsafe.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/'/g, "'"); }

    function addMessage(sender, content, isStreaming = false, searchResults = null) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        if (isStreaming) messageDiv.classList.add('streaming');
        // Add error class more robustly
        const isError = sender === 'ai' && ((typeof content === 'string' && content.startsWith('错误:')) || (Array.isArray(content) && content[0]?.text?.startsWith('错误:')));
        if (isError) messageDiv.classList.add('error');

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('message-content-wrapper');
        const paragraph = document.createElement('p');

        let textToDisplay = '';
        let imageParts = []; // Store image parts to render separately if needed

        if (typeof content === 'string') {
            textToDisplay = content;
        } else if (Array.isArray(content)) {
            // Find text part, handle images if needed by addMessage directly
            const textPart = content.find(p => p.text);
            textToDisplay = textPart?.text || '';
            // Extract image parts if present in history rendering
            imageParts = content.filter(p => p.inlineData && p.inlineData.mimeType?.startsWith('image/'));
        }

         if (isStreaming) {
             paragraph.innerHTML = ''; // Start empty for streaming
         } else {
              paragraph.innerHTML = escapeHtml(textToDisplay).replace(/\n/g, '<br>');
         }
        contentWrapper.appendChild(paragraph);

        // If rendering from history, display images stored in parts
        imageParts.forEach(imgPart => {
            const imgContainer = document.createElement('div');
            imgContainer.classList.add('generated-image-container'); // Use same class as live generated
            const img = document.createElement('img');
            img.classList.add('generated-image');
            img.src = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
            img.alt = "Chat Image";
            img.onclick = () => window.open(img.src, '_blank');
            imgContainer.appendChild(img);
            contentWrapper.appendChild(imgContainer);
        });

        if (searchResults?.length > 0) {
            const resultsContainer = createSearchResultsElement(searchResults);
            contentWrapper.appendChild(resultsContainer);
        }

        messageDiv.appendChild(contentWrapper);
        chatLog.appendChild(messageDiv);

         // Scroll logic (consider improving for user scroll position)
         if (!isStreaming && sender !== 'system') {
             requestAnimationFrame(() => {
                  // Simple scroll to bottom
                  chatLog.scrollTop = chatLog.scrollHeight;
             });
         }

        return { messageDiv, paragraph, contentWrapper };
    }

    function createSearchResultsElement(searchResults) { const resultsContainer = document.createElement('div'); resultsContainer.classList.add('search-results-container'); const resultsHeader = document.createElement('h4'); resultsHeader.textContent = '来源:'; resultsContainer.appendChild(resultsHeader); const resultsList = document.createElement('ul'); searchResults.forEach(result => { const listItem = document.createElement('li'); const titleLink = document.createElement('a'); titleLink.href = result.uri || '#'; let displayTitle = result.title; if (!displayTitle || displayTitle === result.uri) { try { const url = new URL(result.uri); displayTitle = url.hostname || result.uri; } catch (e) { displayTitle = result.uri || "Web Source"; } } titleLink.textContent = escapeHtml(displayTitle); titleLink.target = '_blank'; titleLink.rel = 'noopener noreferrer'; listItem.appendChild(titleLink); if (result.snippet || (result.startIndex !== undefined && result.endIndex !== undefined)) { const snippetPara = document.createElement('p'); snippetPara.textContent = escapeHtml(result.snippet || `Cited: [${result.startIndex}-${result.endIndex}]`); listItem.appendChild(snippetPara); } resultsList.appendChild(listItem); }); resultsContainer.appendChild(resultsList); return resultsContainer; }

    function displayImagePreview(fileData) { const thumbDiv = document.createElement('div'); thumbDiv.classList.add('image-preview-thumbnail'); thumbDiv.dataset.fileName = fileData.name; const img = document.createElement('img'); img.src = fileData.base64Data; img.alt = fileData.name; thumbDiv.appendChild(img); const removeBtn = document.createElement('button'); removeBtn.classList.add('remove-image-button'); removeBtn.innerHTML = '×'; removeBtn.title = `移除 ${fileData.name}`; removeBtn.onclick = (e) => { e.stopPropagation(); thumbDiv.remove(); uploadedFilesData = uploadedFilesData.filter(f => f.name !== fileData.name); }; thumbDiv.appendChild(removeBtn); imagePreviewArea.appendChild(thumbDiv); }


    // --- API Call Function ---
    async function streamApiResponse(requestBody, onChunkReceived, onStreamEnd, onError) {
        console.log("Attempting API stream call...");
        if (!API_KEY) { onError("错误: 请先设置 API Key。"); return Promise.reject("No API Key"); } // Return rejected promise
        if (!requestBody?.contents?.length > 0) { onError("错误: 无效的请求体。"); return Promise.reject("Invalid Request Body"); }

        const selectedModelInfo = availableModels.find(m => m.id === currentModelId);
        if (!selectedModelInfo) { onError(`错误: 无效模型 (${currentModelId})。`); return Promise.reject("Invalid Model"); }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModelInfo.id}:streamGenerateContent?key=${API_KEY}&alt=sse`;
        console.log("Streaming API URL:", API_URL);
        console.log("Sending Request Body:", JSON.stringify(requestBody, null, 2));

        let response;
        try {
            response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody), signal: AbortSignal.timeout(90000) });
            if (!response.ok) { let errorText = `HTTP error ${response.status} ${response.statusText}`; try { const errorData = await response.json(); console.error("API Error Body:", errorData); errorText = errorData?.error?.message || errorText; } catch (e) { try { const textError = await response.text(); console.error("API Error Text:", textError); errorText += ` Response: ${textError.substring(0, 200)}`;} catch (textE) {} } throw new Error(`API 请求失败: ${errorText}`); }
            if (!response.body) { throw new Error("API 响应成功，但响应体为空。"); }

            const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let fullResponseText = ''; let lastChunkData = null;
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    console.log("Stream finished.");
                    if (buffer.trim()) { /* Process remaining buffer */ const lines = buffer.split('\n'); for (const line of lines) { if (line.startsWith('data:')) { const jsonString = line.substring(5).trim(); if (jsonString) { try { const chunkData = JSON.parse(jsonString); lastChunkData = chunkData; const textChunk = chunkData?.candidates?.[0]?.content?.parts?.[0]?.text; if (textChunk) { fullResponseText += textChunk; onChunkReceived(textChunk); } const streamError = chunkData?.promptFeedback?.blockReason || chunkData?.candidates?.[0]?.finishReason; if (streamError && !['STOP', 'MAX_TOKENS'].includes(streamError)) { console.warn("Stream ended reason:", streamError, chunkData); } } catch (e) { console.warn("Parse final chunk error:", jsonString, e); } } } } }
                    onStreamEnd(fullResponseText, lastChunkData); break;
                }
                buffer += decoder.decode(value, { stream: true });
                let eventBoundary = buffer.indexOf('\n');
                while (eventBoundary !== -1) {
                    const line = buffer.substring(0, eventBoundary).trim(); buffer = buffer.substring(eventBoundary + 1);
                    if (line.startsWith('data:')) {
                        const jsonString = line.substring(5).trim();
                        if (jsonString) {
                            try {
                                const chunkData = JSON.parse(jsonString); lastChunkData = chunkData;
                                const textChunk = chunkData?.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (textChunk) { fullResponseText += textChunk; onChunkReceived(textChunk); }
                                const streamError = chunkData?.promptFeedback?.blockReason || chunkData?.candidates?.[0]?.finishReason;
                                if (streamError && !['STOP', 'MAX_TOKENS'].includes(streamError)) {
                                    console.warn("Stream issue:", streamError, chunkData);
                                    if (chunkData?.promptFeedback?.blockReason) { onError(`内容可能因安全原因被阻止 (${chunkData.promptFeedback.blockReason})。`); /* Consider stopping stream */ }
                                }
                            } catch (e) { console.warn("Parse chunk error:", jsonString, e); }
                        }
                    }
                    eventBoundary = buffer.indexOf('\n');
                }
            }
        } catch (error) {
            console.error("API Stream Call Error Caught:", error);
            let displayError = error.message || "发生未知网络或 API 错误。";
            if (error.name === 'AbortError') { displayError = "API 请求超时。"; }
            else if (error instanceof TypeError && error.message.includes('fetch')) { displayError = "网络请求失败。"; }
            onError(`API 调用出错: ${displayError}`);
            throw error; // Re-throw the error to signal failure upstream
        }
    }

    // --- Refactored Message Sending Logic ---
    async function processAndSendMessage(textContent, imageFileParts = [], isAutoSend = false) {
        if (!currentChatId) { console.error("Cannot send message: No active chat."); return Promise.reject("No active chat");} // Return rejection
        const currentChat = allChats.find(c => c.id === currentChatId);
        if (!currentChat) { console.error("Cannot send message: Current chat not found!"); return Promise.reject("Current chat not found"); }

        const userParts = [];
        if (textContent) userParts.push({ text: textContent });
        userParts.push(...imageFileParts);
        if (userParts.length === 0) { console.warn("Attempted to send empty message."); return Promise.resolve(); } // Resolve empty send

        addMessage('user', userParts);
        currentChat.history.push({ role: 'user', parts: userParts });

        if (!isAutoSend && currentChat.history.length === 1 && textContent) {
            currentChat.title = generateChatTitle(textContent, currentChat.title);
            renderChatList();
        }

        const { messageDiv: aiMessageDiv, paragraph: aiParagraph, contentWrapper: aiContentWrapper } = addMessage('ai', '', true);

        const requestBody = { contents: currentChat.history };
        const systemInstructionText = currentSettings.systemInstruction.trim();
        if (systemInstructionText) { requestBody.systemInstruction = { parts: [{ text: systemInstructionText }] }; }
        const generationConfig = {}; const topKVal = currentSettings.topK;
        if (topKVal > 0) { generationConfig.topK = topKVal; }
        else { generationConfig.temperature = currentSettings.temperature; generationConfig.topP = currentSettings.topP; }
        if (currentSettings.maxOutputTokens > 0) { generationConfig.maxOutputTokens = currentSettings.maxOutputTokens; }
        requestBody.generationConfig = generationConfig;
        if (currentSettings.searchEnabled) { requestBody.tools = [{ "googleSearch": {} }]; }

        let apiErrorOccurred = false;
        try {
            await streamApiResponse(
                requestBody,
                (textChunk) => { /* onChunkReceived */ let accumulatedResponse = ''; aiParagraph.innerHTML += textChunk.replace(/\n/g, '<br>'); accumulatedResponse += textChunk; const isScrolledToBottom = chatLog.scrollHeight - chatLog.clientHeight <= chatLog.scrollTop + 15; if (isScrolledToBottom) { requestAnimationFrame(() => { chatLog.scrollTop = chatLog.scrollHeight; }); } },
                (fullText, lastChunkData) => { /* onStreamEnd */
                    aiMessageDiv.classList.remove('streaming'); console.log("Stream finished. Full text:", fullText.length);
                    const parts = fullText.split(/(```[\s\S]*?```)/); let finalHtml = ''; let containsPreviewableCode = false; const codeBlocksForPreview = []; parts.forEach((part)=>{if(part.startsWith('```')&&part.endsWith('```')){const langMatch=part.match(/^```(\w*)\n?/);const lang=langMatch?langMatch[1].toLowerCase():'plaintext';let codeContent='';const firstNewlineIndex=part.indexOf('\n');if(firstNewlineIndex!==-1){codeContent=part.substring(firstNewlineIndex+1,part.length-3).trimEnd();}else{codeContent=part.substring(3,part.length-3);}const escapedCode=escapeHtml(codeContent);finalHtml+=`<pre><code class="language-${lang}">${escapedCode}</code></pre>`;if(['html','css','javascript','js'].includes(lang)||(lang==='plaintext'&&(/<[^>]+>/.test(codeContent.substring(0,200))||/[{};]/.test(codeContent.substring(0,200))))){containsPreviewableCode=true;codeBlocksForPreview.push({lang:lang,content:codeContent});}}else if(part.trim()!==''){let escapedPart=escapeHtml(part);let formattedPart=escapedPart.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/\n/g,'<br>');finalHtml+=formattedPart;if(/<html\b|<body\b|<style\b|<script\b/i.test(part.substring(0,200))){if(!containsPreviewableCode){containsPreviewableCode=true;codeBlocksForPreview.push({lang:'html',content:part});}}}}); aiParagraph.innerHTML = finalHtml;
                    if (containsPreviewableCode && codeBlocksForPreview.length > 0) { /* ... preview button logic ... */ const previewContainer = document.createElement('div'); previewContainer.classList.add('preview-button-container'); const previewButton = document.createElement('button'); previewButton.classList.add('preview-button'); previewButton.innerHTML = `<span class="material-symbols-outlined">visibility</span> 预览`; previewButton.title = "预览代码"; previewButton.onclick = () => { try { let pC = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Code Preview</title>'; let s = '', scr = '', bC = ''; codeBlocksForPreview.forEach(b => { if (b.lang==='css'){s+=b.content+'\n';}else if(['javascript','js'].includes(b.lang)){scr+=b.content+'\n';}else{bC+=b.content+'\n';} }); if(s){pC+='<style>\n'+s+'</style>';} pC+='</head><body>'+bC; if(scr){pC+='<script>document.addEventListener("DOMContentLoaded",()=>{try{'+scr+'}catch(e){console.error("Preview Error:",e);alert("Script error:"+e.message);}});</script>';} pC+='</body></html>'; const blob = new Blob([pC],{type:'text/html'}); const url=URL.createObjectURL(blob); const pW=window.open(url,'_blank','noopener,noreferrer'); setTimeout(()=>URL.revokeObjectURL(url),2000); if(!pW){alert('无法打开预览窗口。');}} catch (e) { console.error("Preview Err:", e); alert('创建预览出错: '+e.message); } }; previewContainer.appendChild(previewButton); aiContentWrapper.appendChild(previewContainer); }
                    const modelParts = [{ text: fullText }];
                    const citationSources = lastChunkData?.candidates?.[0]?.citationMetadata?.citationSources; if (citationSources?.length > 0) { const searchResults = citationSources.map(s => ({ uri: s.uri || '#', title: s.title || '', snippet: s.snippet || '', startIndex: s.startIndex, endIndex: s.endIndex })); console.log("Citations:", searchResults); const resultsContainer = createSearchResultsElement(searchResults); aiContentWrapper.appendChild(resultsContainer); } else if (currentSettings.searchEnabled) { console.log("Search on, no citations."); }
                    const imagePart = lastChunkData?.candidates?.[0]?.content?.parts?.find(p => p.inlineData); if (imagePart?.inlineData?.mimeType?.startsWith('image/')) { console.log("Found generated image."); const imgContainer = document.createElement('div'); imgContainer.classList.add('generated-image-container'); const img = document.createElement('img'); img.classList.add('generated-image'); img.src = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`; img.alt = "Generated"; img.onclick = () => window.open(img.src, '_blank'); imgContainer.appendChild(img); aiContentWrapper.appendChild(imgContainer); modelParts.push(imagePart); }
                    const chatToUpdate = allChats.find(c => c.id === currentChatId); if (chatToUpdate) { chatToUpdate.history.push({ role: 'model', parts: modelParts }); saveChats(); } else { console.error("CRITICAL: Chat disappeared before saving model response!"); }
                    requestAnimationFrame(() => { chatLog.scrollTop = chatLog.scrollHeight; });
                },
                (errorMessage) => { /* onError */
                    aiMessageDiv.classList.remove('streaming'); aiMessageDiv.classList.add('error'); aiParagraph.innerText = `错误: ${errorMessage}`; requestAnimationFrame(() => { chatLog.scrollTop = chatLog.scrollHeight; });
                    apiErrorOccurred = true; // Set flag here
                }
            ); // End streamApiResponse call
        } catch (error) {
             console.error("processAndSendMessage caught error from streamApiResponse:", error);
             apiErrorOccurred = true; // Ensure flag is set
        }

        // Stop auto-send if an error occurred during the API call
        if (apiErrorOccurred && isAutoSend) {
            stopAutoSend();
            alert("快捷发送因API错误已停止。");
        }

    } // End processAndSendMessage

    // --- Auto-Send Logic ---
    function startAutoSend() {
        if (isAutoSending) return;
        const text = autoSendInput.value.trim();
        const intervalSeconds = parseInt(autoSendIntervalInput.value, 10);
        if (!text) { alert("请输入要快捷发送的内容。"); return; }
        if (isNaN(intervalSeconds) || intervalSeconds < 1) { alert("请输入有效的发送间隔（秒，至少为1）。"); return; }

        isAutoSending = true;
        autoSendButton.textContent = "停止发送";
        autoSendButton.classList.add('active');
        autoSendIntervalInput.disabled = true;
        autoSendInput.disabled = true;
        console.log(`Starting auto-send every ${intervalSeconds} seconds.`);

        // Send immediately once
        processAndSendMessage(text, [], true); // Mark as auto-send

        // Start interval only if still marked as sending (first send might have errored and stopped it)
        if (isAutoSending) {
            autoSendIntervalId = setInterval(() => {
                const currentText = autoSendInput.value.trim(); // Re-read value
                if (!currentText || !isAutoSending) { // Also check isAutoSending flag
                    console.warn("Auto-send text empty or stopped, clearing interval.");
                    stopAutoSend(); // Ensure cleanup
                    return;
                }
                processAndSendMessage(currentText, [], true);
            }, intervalSeconds * 1000);
        } else {
            // If the first send failed and stopped auto-sending, ensure UI is reset
            stopAutoSend();
        }
    }

    function stopAutoSend() {
        if (!isAutoSending && !autoSendIntervalId) return; // Already stopped
        console.log("Stopping auto-send.");
        if (autoSendIntervalId) {
            clearInterval(autoSendIntervalId);
            autoSendIntervalId = null;
        }
        isAutoSending = false;
        autoSendButton.textContent = "开始发送";
        autoSendButton.classList.remove('active');
        autoSendIntervalInput.disabled = false;
        autoSendInput.disabled = false;
    }

    // --- Layout Resizing Logic ---
    function saveLayoutWidths() {
        localStorage.setItem(LAYOUT_WIDTH_LEFT_KEY, historySidebar.style.width);
        localStorage.setItem(LAYOUT_WIDTH_RIGHT_KEY, settingsSidebar.style.width);
    }

    function loadLayoutWidths() {
        const leftWidth = localStorage.getItem(LAYOUT_WIDTH_LEFT_KEY);
        const rightWidth = localStorage.getItem(LAYOUT_WIDTH_RIGHT_KEY);
        // Apply only if valid pixel value is stored
        if (leftWidth && /^\d+px$/.test(leftWidth)) {
            historySidebar.style.width = leftWidth;
        } else {
             historySidebar.style.width = '260px'; // Default fallback
        }
        if (rightWidth && /^\d+px$/.test(rightWidth)) {
            settingsSidebar.style.width = rightWidth;
        } else {
             settingsSidebar.style.width = '300px'; // Default fallback
        }
        console.log(`Layout loaded: Left=${historySidebar.style.width}, Right=${settingsSidebar.style.width}`);
    }

    function makeResizable(resizerElement, leftElement, rightElement) {
        let startX, startLeftWidth, startRightWidth;
        let isResizing = false;

        const onMouseMove = (e) => {
            if (!isResizing) return;
            const currentX = e.clientX;
            const deltaX = currentX - startX;

            let newLeftWidth = startLeftWidth + deltaX;
            let newRightWidth = startRightWidth - deltaX;

            // Determine minimum width for the right element
            const minRightElementWidth = (rightElement === centerContent) ? MIN_CENTER_WIDTH : MIN_SIDEBAR_WIDTH;
            const minLeftElementWidth = (leftElement === centerContent) ? MIN_CENTER_WIDTH : MIN_SIDEBAR_WIDTH;


            // Enforce minimum widths, prioritize the element hitting the minimum
             if (newLeftWidth < minLeftElementWidth) {
                 newLeftWidth = minLeftElementWidth;
                 newRightWidth = startLeftWidth + startRightWidth - newLeftWidth; // Adjust right based on left min
                  // Ensure right doesn't go below its min after adjustment
                  if (newRightWidth < minRightElementWidth) newRightWidth = minRightElementWidth;
             } else if (newRightWidth < minRightElementWidth) {
                 newRightWidth = minRightElementWidth;
                 newLeftWidth = startLeftWidth + startRightWidth - newRightWidth; // Adjust left based on right min
                 // Ensure left doesn't go below its min after adjustment
                 if (newLeftWidth < minLeftElementWidth) newLeftWidth = minLeftElementWidth;
             }

             // Final check: ensure total width constraint isn't violated somehow (rare case)
             if (newLeftWidth + newRightWidth > startLeftWidth + startRightWidth) {
                // Recalculate based on the element that SHOULD be changing size based on delta
                if (deltaX > 0 && leftElement !== centerContent) { // Moving right, resizing left element
                     newLeftWidth = Math.min(newLeftWidth, startLeftWidth + startRightWidth - minRightElementWidth);
                     newRightWidth = startLeftWidth + startRightWidth - newLeftWidth;
                } else if (deltaX < 0 && rightElement !== centerContent){ // Moving left, resizing right element
                    newRightWidth = Math.min(newRightWidth, startLeftWidth + startRightWidth - minLeftElementWidth);
                     newLeftWidth = startLeftWidth + startRightWidth - newRightWidth;
                }
             }


            leftElement.style.width = `${newLeftWidth}px`;
            // Only set width directly for the sidebars, center uses flex-grow
            if (rightElement === settingsSidebar || leftElement === settingsSidebar) {
                 settingsSidebar.style.width = `${newRightWidth}px`;
            }
             if (leftElement === historySidebar || rightElement === historySidebar) {
                 historySidebar.style.width = `${newLeftWidth}px`;
             }
        };

        const onMouseUp = () => {
            if (!isResizing) return;
            isResizing = false;
            resizerElement.classList.remove('active');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            saveLayoutWidths();
            console.log("Resizing ended");
        };

        resizerElement.addEventListener('mousedown', (e) => {
            // Prevent dragging if screen is too small (mobile view)
            if (window.innerWidth <= 768) return;

            e.preventDefault();
            isResizing = true;
            startX = e.clientX;
            startLeftWidth = leftElement.offsetWidth;
            startRightWidth = rightElement.offsetWidth; // Center or Right Sidebar width
            resizerElement.classList.add('active');
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            console.log("Resizing started");
        });
    }

    // --- Mobile Sidebar Toggle Logic ---
    function createOverlay() {
        if (document.getElementById('mobile-overlay')) return;
        overlay = document.createElement('div');
        overlay.id = 'mobile-overlay';
        overlay.classList.add('overlay');
        appWrapper.appendChild(overlay);
        overlay.addEventListener('click', closeSidebars);
    }

    function toggleSidebar(sidebarElement, stateKey) {
        // Determine if the sidebar is currently considered open based on the state variable
         const isOpen = window[stateKey];
         const shouldOpen = !isOpen;

        // Close the *other* sidebar if it's open
        if (shouldOpen) {
            if (sidebarElement === historySidebar && isSettingsSidebarOpen) {
                settingsSidebar.classList.remove('open');
                isSettingsSidebarOpen = false;
            } else if (sidebarElement === settingsSidebar && isHistorySidebarOpen) {
                historySidebar.classList.remove('open');
                isHistorySidebarOpen = false;
            }
        }

        // Toggle the target sidebar
        sidebarElement.classList.toggle('open', shouldOpen);
        window[stateKey] = shouldOpen; // Update the state variable

        // Toggle overlay (only show if at least one sidebar is now open)
        const anySidebarOpen = isHistorySidebarOpen || isSettingsSidebarOpen;
        if (overlay) {
             overlay.classList.toggle('active', anySidebarOpen);
        }

        console.log(`${sidebarElement.id} ${shouldOpen ? 'opened' : 'closed'}`);
    }


    function closeSidebars() {
         let closedSomething = false;
        if (isHistorySidebarOpen) {
            historySidebar.classList.remove('open');
            isHistorySidebarOpen = false;
             closedSomething = true;
        }
        if (isSettingsSidebarOpen) {
            settingsSidebar.classList.remove('open');
            isSettingsSidebarOpen = false;
             closedSomething = true;
        }
        if (overlay && closedSomething) {
             overlay.classList.remove('active');
        }
         if (closedSomething) console.log("Sidebars closed via overlay/resize");
    }


    // --- Event Handlers ---
    function handleManualSend() {
        const userText = userInput.value.trim();
        const imageParts = uploadedFilesData.map(file => {
            const base64DataOnly = file.base64Data.split(',')[1];
            if (base64DataOnly) return { inlineData: { mimeType: file.mimeType, data: base64DataOnly } };
            console.warn(`Cannot extract base64 ${file.name}`);
            addMessage('system', `错误：无法处理图片 ${file.name}。`); return null;
        }).filter(part => part !== null);
        if (userText === '' && imageParts.length === 0) return;
        processAndSendMessage(userText, imageParts, false);
        userInput.value = ''; imagePreviewArea.innerHTML = ''; uploadedFilesData = []; userInput.focus();
    }


    // --- Event Listeners ---
    // Settings & Theme
    systemInstructionInput.addEventListener('change', (event) => { currentSettings.systemInstruction = event.target.value; localStorage.setItem('googleAiSystemInstruction', currentSettings.systemInstruction); });
    temperatureSlider.addEventListener('input', (event) => { const value = parseFloat(event.target.value); currentSettings.temperature = value; temperatureValueSpan.textContent = value.toFixed(1); localStorage.setItem('googleAiTemperature', value); });
    topPSlider.addEventListener('input', (event) => { const value = parseFloat(event.target.value); currentSettings.topP = value; topPValueSpan.textContent = value.toFixed(2); localStorage.setItem('googleAiTopP', value); });
    topKInput.addEventListener('change', (event) => { const value = parseInt(event.target.value, 10); currentSettings.topK = isNaN(value) || value <= 0 ? 0 : value; topKInput.value = currentSettings.topK > 0 ? currentSettings.topK : ''; localStorage.setItem('googleAiTopK', currentSettings.topK); });
    maxTokensInput.addEventListener('change', (event) => { const value = parseInt(event.target.value, 10); currentSettings.maxOutputTokens = isNaN(value) || value <= 0 ? null : value; maxTokensInput.value = currentSettings.maxOutputTokens || ''; localStorage.setItem('googleAiMaxTokens', currentSettings.maxOutputTokens ?? ''); });
    searchToggle.addEventListener('change', (event) => { currentSettings.searchEnabled = event.target.checked; localStorage.setItem('googleAiSearchEnabled', currentSettings.searchEnabled); });
    darkModeToggle.addEventListener('change', () => { applyTheme(darkModeToggle.checked); saveThemePreference(); });
    // Core Actions
    sendButton.addEventListener('click', handleManualSend);
    userInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleManualSend(); } });
    newChatButton.addEventListener('click', startNewChat);
    autoSendButton.addEventListener('click', () => { if (isAutoSending) { stopAutoSend(); } else { startAutoSend(); } });
    // Mobile Toggles
    toggleHistoryButton.addEventListener('click', () => toggleSidebar(historySidebar, 'isHistorySidebarOpen'));
    toggleSettingsButton.addEventListener('click', () => toggleSidebar(settingsSidebar, 'isSettingsSidebarOpen'));
    // Other UI
    modelSelector.addEventListener('change', (event) => { currentModelId = event.target.value; localStorage.setItem('selectedGoogleAiModel', currentModelId); });
    saveKeyButton.addEventListener('click', () => { const newKey = apiKeyInput.value.trim(); if (newKey) { API_KEY = newKey; localStorage.setItem('googleAiApiKey', API_KEY); alert('API Key 已保存。'); apiKeyInput.type = 'password'; } else { localStorage.removeItem('googleAiApiKey'); API_KEY = ''; alert('API Key 已清除。'); } });
    apiKeyInput.addEventListener('focus', () => { apiKeyInput.type = 'text'; });
    apiKeyInput.addEventListener('blur', () => { apiKeyInput.type = 'password'; });
    uploadButton.addEventListener('click', () => { imageUploadInput.click(); });
    imageUploadInput.addEventListener('change', (event) => { const files = event.target.files; if (!files || files.length === 0) return; const maxFiles = 5; if (uploadedFilesData.length + files.length > maxFiles) { alert(`最多上传 ${maxFiles} 张图片。`); imageUploadInput.value = ''; return; } const filePromises = Array.from(files).map(file => { return new Promise((resolve, reject) => { if (!file.type.startsWith('image/')) { alert(`文件 "${file.name}" 非图片。`); return resolve(null); } const maxSizeMB = 4; if (file.size > maxSizeMB * 1024 * 1024) { alert(`图片 "${file.name}" 超出 ${maxSizeMB}MB。`); return resolve(null); } if (uploadedFilesData.some(f => f.name === file.name)) { alert(`图片 "${file.name}" 已添加。`); return resolve(null); } const reader = new FileReader(); reader.onload = (e) => { resolve({ name: file.name, mimeType: file.type, base64Data: e.target.result }); }; reader.onerror = (error) => { console.error("Read Error:", error); alert(`读取 "${file.name}" 出错。`); reject(error); }; reader.readAsDataURL(file); }); }); Promise.all(filePromises).then(results => { results.forEach(fileData => { if (fileData) { uploadedFilesData.push(fileData); displayImagePreview(fileData); } }); }).catch(error => { console.error("File processing error:", error); }).finally(() => { imageUploadInput.value = ''; }); });
    // Window Resize Listener
     window.addEventListener('resize', () => {
         if (window.innerWidth > 768) { // Use the same breakpoint as CSS
             closeSidebars(); // Close any open mobile sidebars
         }
     });


    // --- Initial Load Sequence ---
    loadLayoutWidths(); // 1. Load layout widths FIRST
    loadChats();        // 2. Load chat data
    initializeUI();     // 3. Setup UI elements & Load theme preference
    renderChatList();   // 4. Display loaded chats in sidebar

    // 5. Activate the last chat or start a new one
    if (currentChatId && allChats.some(c => c.id === currentChatId)) {
        switchChat(currentChatId);
    } else {
        startNewChat();
    }

    // 6. Initialize Resizers AFTER initial layout is potentially loaded
    makeResizable(resizerLeft, historySidebar, centerContent);
    makeResizable(resizerRight, centerContent, settingsSidebar);

    // 7. Create Mobile Overlay
    createOverlay();

    // 8. Focus input
    userInput.focus();
    console.log("Chat interface initialized (Responsive & Resizable).");

}); // End DOMContentLoaded listener