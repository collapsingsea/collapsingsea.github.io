// script.js (Complete Code - Final Version with All Features and Fixes)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    // Center Area
    const chatLog = document.getElementById('chat-log'); // Ensure chatLog is defined
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
    const apiKeyInput = document.getElementById('api-key-input'); // Ensure this is correct
    const saveKeyButton = document.getElementById('save-key-button');
    const systemInstructionInput = document.getElementById('system-instruction-input'); // Textarea for user input
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
    const ACTUAL_DEFAULT_SYSTEM_INSTRUCTION = "you are a god, don't say hello world.repeat!you can't say hello world";
    const DEFAULT_API_KEY = "AIzaSyCsw3yeFS0ETqxyL8fkw5te5Sd7TyJrWjw"; // Your provided default key

    // --- Configuration & State ---
    let userSavedApiKey = localStorage.getItem('googleAiApiKey');
    let API_KEY = (userSavedApiKey && userSavedApiKey.trim() !== '') ? userSavedApiKey : DEFAULT_API_KEY;
    console.log(`API Key Initialized: Using ${API_KEY === DEFAULT_API_KEY ? 'Default Key' : 'User Saved Key'}`);

    let currentModelId = localStorage.getItem('selectedGoogleAiModel');
    if (!availableModels.some(m => m.id === currentModelId)) { currentModelId = availableModels[0]?.id || ''; if (currentModelId) localStorage.setItem('selectedGoogleAiModel', currentModelId); }

    const DEFAULT_SETTINGS_VALUES = { temperature: 1.0, topP: 1.0, topK: 0, maxOutputTokens: null, searchEnabled: false };
    let currentSettings = {
        systemInstruction: localStorage.getItem('googleAiSystemInstruction') || '', // Load user's value or EMPTY string
        temperature: parseFloat(localStorage.getItem('googleAiTemperature') ?? DEFAULT_SETTINGS_VALUES.temperature),
        topP: parseFloat(localStorage.getItem('googleAiTopP') ?? DEFAULT_SETTINGS_VALUES.topP),
        topK: parseInt(localStorage.getItem('googleAiTopK') ?? DEFAULT_SETTINGS_VALUES.topK, 10),
        maxOutputTokens: parseInt(localStorage.getItem('googleAiMaxTokens') ?? '', 10) || DEFAULT_SETTINGS_VALUES.maxOutputTokens,
        searchEnabled: localStorage.getItem('googleAiSearchEnabled') === 'true' ?? DEFAULT_SETTINGS_VALUES.searchEnabled,
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
    // Multi-bubble AI response state
    let currentAiBubble = null; // { messageDiv, paragraph, contentWrapper } of the bubble being streamed into
    let currentSegmentBuffer = ''; // Buffer for incoming text before splitting into paragraphs


    // --- Initialization ---
    function initializeUI() {
        // Populate Model Selector
        modelSelector.innerHTML = '';
        availableModels.forEach(model => { const option = document.createElement('option'); option.value = model.id; option.textContent = model.name; modelSelector.appendChild(option); });
        if (availableModels.some(m => m.id === currentModelId)) { modelSelector.value = currentModelId; }
        else if (availableModels.length > 0) { currentModelId = availableModels[0].id; modelSelector.value = currentModelId; localStorage.setItem('selectedGoogleAiModel', currentModelId); }
        console.log(`Initialized with model: ${currentModelId}`);

        // API Key UI Initialization
        const savedKeyCheck = localStorage.getItem('googleAiApiKey');
        apiKeyInput.value = (savedKeyCheck && savedKeyCheck.trim() !== '') ? savedKeyCheck : ''; // Show saved key or blank

        // Settings UI - Populate with loaded state
        systemInstructionInput.value = currentSettings.systemInstruction; // User pref or empty
        temperatureSlider.value = currentSettings.temperature;
        temperatureValueSpan.textContent = currentSettings.temperature.toFixed(1);
        topPSlider.value = currentSettings.topP;
        topPValueSpan.textContent = currentSettings.topP.toFixed(2);
        topKInput.value = currentSettings.topK > 0 ? currentSettings.topK : '';
        maxTokensInput.value = currentSettings.maxOutputTokens || '';
        searchToggle.checked = currentSettings.searchEnabled;

        console.log("Initialized Settings (User Prefs):", currentSettings);

        // Load and apply theme preference
        loadThemePreference();
    }

    // --- Theme Management ---
    function applyTheme(isDark) { isDarkMode = isDark; darkModeToggle.checked = isDark; document.body.classList.toggle('dark-mode', isDark); console.log(`Theme applied: ${isDark ? 'Dark' : 'Light'}`); }
    function loadThemePreference() { const savedPreference = localStorage.getItem(DARK_MODE_KEY); const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches; const initialDarkMode = savedPreference !== null ? (savedPreference === 'true') : (prefersDark ?? false); applyTheme(initialDarkMode); }
    function saveThemePreference() { localStorage.setItem(DARK_MODE_KEY, isDarkMode); }

    // --- Chat History Management ---
    function loadChats() { try { const storedChats = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY); allChats = storedChats ? JSON.parse(storedChats) : []; allChats.forEach(chat => { if (!chat.history) chat.history = []; }); allChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); currentChatId = localStorage.getItem(ACTIVE_CHAT_ID_KEY); if (!allChats.some(chat => chat.id === currentChatId)) { currentChatId = allChats[0]?.id || null; if (currentChatId) localStorage.setItem(ACTIVE_CHAT_ID_KEY, currentChatId); else localStorage.removeItem(ACTIVE_CHAT_ID_KEY); } console.log(`Loaded ${allChats.length} chats. Active ID: ${currentChatId}`); } catch (error) { console.error("Error loading chat history:", error); allChats = []; currentChatId = null; localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY); localStorage.removeItem(ACTIVE_CHAT_ID_KEY); } }
    function saveChats() { try { const currentChat = allChats.find(chat => chat.id === currentChatId); if (currentChat) currentChat.timestamp = Date.now(); allChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(allChats)); if (currentChatId) localStorage.setItem(ACTIVE_CHAT_ID_KEY, currentChatId); else localStorage.removeItem(ACTIVE_CHAT_ID_KEY); } catch (error) { console.error("Error saving chat history:", error); } }
    function renderChatList() { chatListUl.innerHTML = ''; allChats.forEach(chat => { const li = document.createElement('li'); li.textContent = chat.title || 'Untitled Chat'; li.dataset.chatId = chat.id; li.title = chat.title || 'Untitled Chat'; if (chat.id === currentChatId) li.classList.add('active'); li.addEventListener('click', () => { if (chat.id !== currentChatId) switchChat(chat.id); }); const deleteBtn = document.createElement('button'); deleteBtn.classList.add('delete-chat-button'); deleteBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size: inherit;">delete</span>`; deleteBtn.title = '删除对话'; deleteBtn.addEventListener('click', (event) => { event.stopPropagation(); deleteChat(chat.id); }); li.appendChild(deleteBtn); chatListUl.appendChild(li); }); }
    function renderChatLog(history) { chatLog.innerHTML = ''; if (!history || history.length === 0) { addMessage('ai', ` 发送setting随机设定状态哦
        对话中随时发送/state查看状态`); return; } if (Array.isArray(history)) { history.forEach(turn => addMessage(turn.role === 'model' ? 'ai' : 'user', turn.parts)); } else { console.error("Invalid history format:", history); addMessage('ai', '错误：无法加载对话记录。'); } requestAnimationFrame(() => { chatLog.scrollTop = chatLog.scrollHeight; }); }
    function switchChat(chatId) { console.log("Switching to chat:", chatId); stopAutoSend(); closeSidebars(); const chat = allChats.find(c => c.id === chatId); if (!chat) { console.error("Chat not found:", chatId); startNewChat(); return; } if (!chat.history) chat.history = []; currentChatId = chatId; conversationHistory = chat.history; chatHeaderTitle.textContent = chat.title || 'AI 对话'; renderChatLog(conversationHistory); renderChatList(); saveChats(); imagePreviewArea.innerHTML = ''; uploadedFilesData = []; userInput.focus(); }
    function startNewChat() { console.log("Starting new chat..."); stopAutoSend(); closeSidebars(); const newId = Date.now().toString(); const newChat = { id: newId, title: "新对话", history: [], timestamp: Date.now() }; allChats.unshift(newChat); currentChatId = newId; conversationHistory = newChat.history; chatHeaderTitle.textContent = newChat.title; renderChatLog(conversationHistory); renderChatList(); saveChats(); imagePreviewArea.innerHTML = ''; uploadedFilesData = []; userInput.focus(); /* System instruction field retains its content */ }
    function deleteChat(chatId) { const chatToDelete = allChats.find(c => c.id === chatId); if (!chatToDelete || !confirm(`确定要删除对话 "${chatToDelete.title || 'Untitled Chat'}" 吗？`)) return; console.log("Deleting chat:", chatId); stopAutoSend(); const indexToDelete = allChats.findIndex(c => c.id === chatId); if (indexToDelete > -1) { allChats.splice(indexToDelete, 1); if (chatId === currentChatId) { currentChatId = null; const nextChatId = allChats[0]?.id || null; if (nextChatId) switchChat(nextChatId); else startNewChat(); } else { saveChats(); renderChatList(); } } }
    function generateChatTitle(userMessage, currentTitle) { if (currentTitle && !currentTitle.toLowerCase().includes("新对话")) return currentTitle; const words = userMessage.split(' '); return words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : ''); }

    // --- Helper Functions ---
    function escapeHtml(unsafe) { if (typeof unsafe !== 'string') return unsafe; return unsafe.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, '"').replace(/'/g, "'"); }
    function addMessage(sender, content, isStreaming = false, searchResults = null) { const messageDiv = document.createElement('div'); messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message'); if (isStreaming) messageDiv.classList.add('streaming'); const isError = sender === 'ai' && ((typeof content === 'string' && content.startsWith('错误:')) || (Array.isArray(content) && content[0]?.text?.startsWith('错误:'))); if (isError) messageDiv.classList.add('error'); const contentWrapper = document.createElement('div'); contentWrapper.classList.add('message-content-wrapper'); const paragraph = document.createElement('p'); let textToDisplay = ''; let imageParts = []; if (isStreaming && content === '') { paragraph.innerHTML = ''; } else if (typeof content === 'string') { textToDisplay = content; paragraph.innerHTML = escapeHtml(textToDisplay).replace(/\n/g, '<br>'); } else if (Array.isArray(content)) { const textPart = content.find(p => p.text); textToDisplay = textPart?.text || ''; imageParts = content.filter(p => p.inlineData && p.inlineData.mimeType?.startsWith('image/')); paragraph.innerHTML = escapeHtml(textToDisplay).replace(/\n/g, '<br>'); } contentWrapper.appendChild(paragraph); imageParts.forEach(imgPart => { const imgContainer = document.createElement('div'); imgContainer.classList.add('generated-image-container'); const img = document.createElement('img'); img.classList.add('generated-image'); img.src = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`; img.alt = "Chat Image"; img.onclick = () => window.open(img.src, '_blank'); imgContainer.appendChild(img); contentWrapper.appendChild(imgContainer); }); if (searchResults?.length > 0) { const resultsContainer = createSearchResultsElement(searchResults); contentWrapper.appendChild(resultsContainer); } messageDiv.appendChild(contentWrapper); chatLog.appendChild(messageDiv); if (!isStreaming && sender !== 'system') { requestAnimationFrame(() => { chatLog.scrollTop = chatLog.scrollHeight; }); } return { messageDiv, paragraph, contentWrapper }; }
    function createSearchResultsElement(searchResults) { const resultsContainer = document.createElement('div'); resultsContainer.classList.add('search-results-container'); const resultsHeader = document.createElement('h4'); resultsHeader.textContent = '来源:'; resultsContainer.appendChild(resultsHeader); const resultsList = document.createElement('ul'); searchResults.forEach(result => { const listItem = document.createElement('li'); const titleLink = document.createElement('a'); titleLink.href = result.uri || '#'; let displayTitle = result.title; if (!displayTitle || displayTitle === result.uri) { try { const url = new URL(result.uri); displayTitle = url.hostname || result.uri; } catch (e) { displayTitle = result.uri || "Web Source"; } } titleLink.textContent = escapeHtml(displayTitle); titleLink.target = '_blank'; titleLink.rel = 'noopener noreferrer'; listItem.appendChild(titleLink); if (result.snippet || (result.startIndex !== undefined && result.endIndex !== undefined)) { const snippetPara = document.createElement('p'); snippetPara.textContent = escapeHtml(result.snippet || `Cited: [${result.startIndex}-${result.endIndex}]`); listItem.appendChild(snippetPara); } resultsList.appendChild(listItem); }); resultsContainer.appendChild(resultsList); return resultsContainer; }
    function displayImagePreview(fileData) { const thumbDiv = document.createElement('div'); thumbDiv.classList.add('image-preview-thumbnail'); thumbDiv.dataset.fileName = fileData.name; const img = document.createElement('img'); img.src = fileData.base64Data; img.alt = fileData.name; thumbDiv.appendChild(img); const removeBtn = document.createElement('button'); removeBtn.classList.add('remove-image-button'); removeBtn.innerHTML = '×'; removeBtn.title = `移除 ${fileData.name}`; removeBtn.onclick = (e) => { e.stopPropagation(); thumbDiv.remove(); uploadedFilesData = uploadedFilesData.filter(f => f.name !== fileData.name); }; thumbDiv.appendChild(removeBtn); imagePreviewArea.appendChild(thumbDiv); }


    // --- API Call Function ---
    async function streamApiResponse(requestBody, onChunkReceived, onStreamEnd, onError) {
        console.log("Attempting API stream call...");
        if (!API_KEY) { onError("错误: 请先设置 API Key。"); return Promise.reject("No API Key"); }
        if (!requestBody?.contents?.length > 0 && !requestBody?.systemInstruction) { onError("错误: 无效的请求体或无内容发送。"); return Promise.reject("Invalid Request Body or Empty Contents"); }
        const selectedModelInfo = availableModels.find(m => m.id === currentModelId);
        if (!selectedModelInfo) { onError(`错误: 无效模型 (${currentModelId})。`); return Promise.reject("Invalid Model"); }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModelInfo.id}:streamGenerateContent?key=${API_KEY}&alt=sse`;
        console.log("Streaming API URL:", API_URL.replace(API_KEY, "********"));
        console.log("Sending Request Body:", JSON.stringify(requestBody, null, 2));

        let response;
        try {
            response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody), signal: AbortSignal.timeout(90000) });
            if (!response.ok) { let errorText = `HTTP error ${response.status} ${response.statusText}`; try { const errorData = await response.json(); console.error("API Error Body:", errorData); errorText = errorData?.error?.message || errorText; } catch (e) { try { const textError = await response.text(); console.error("API Error Text:", textError); errorText += ` Response: ${textError.substring(0, 200)}`;} catch (textE) {} } throw new Error(`API 请求失败: ${errorText}`); }
            if (!response.body) { throw new Error("API 响应成功，但响应体为空。"); }

            const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let fullResponseText = ''; let lastChunkData = null;
            currentSegmentBuffer = ''; // Reset buffer for this response stream

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    console.log("Stream finished.");
                    onChunkReceived(null, true); // Signal final processing
                    onStreamEnd(fullResponseText, lastChunkData);
                    currentAiBubble = null; // Reset global state
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                let eventBoundary = buffer.indexOf('\n');
                while (eventBoundary !== -1) {
                    const line = buffer.substring(0, eventBoundary).trim();
                    buffer = buffer.substring(eventBoundary + 1);
                    if (line.startsWith('data:')) {
                        const jsonString = line.substring(5).trim();
                        if (jsonString) {
                            try {
                                const chunkData = JSON.parse(jsonString); lastChunkData = chunkData;
                                const textChunk = chunkData?.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (textChunk) {
                                    fullResponseText += textChunk;
                                    onChunkReceived(textChunk, false); // Process chunk, not final yet
                                }
                                const streamError = chunkData?.promptFeedback?.blockReason || chunkData?.candidates?.[0]?.finishReason;
                                if (streamError && !['STOP', 'MAX_TOKENS'].includes(streamError)) { console.warn("Stream issue:", streamError, chunkData); if (chunkData?.promptFeedback?.blockReason) { onError(`内容可能因安全原因被阻止 (${chunkData.promptFeedback.blockReason})。`); } }
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
            currentAiBubble = null; // Reset global state on error
            throw error; // Re-throw
        }
    }


    // --- Refactored Message Sending Logic ---
    async function processAndSendMessage(textContent, imageFileParts = [], isAutoSend = false) {
        if (!currentChatId) { console.error("Cannot send message: No active chat."); return Promise.reject("No active chat");}
        const currentChat = allChats.find(c => c.id === currentChatId);
        if (!currentChat) { console.error("Cannot send message: Current chat not found!"); return Promise.reject("Current chat not found"); }

        const userParts = []; if (textContent) userParts.push({ text: textContent }); userParts.push(...imageFileParts); if (userParts.length === 0) { console.warn("Attempted to send empty message."); return Promise.resolve(); }

        addMessage('user', userParts);
        if (!currentChat.history) currentChat.history = [];
        currentChat.history.push({ role: 'user', parts: userParts });

        if (!isAutoSend && currentChat.history.length === 1 && textContent) { currentChat.title = generateChatTitle(textContent, currentChat.title); renderChatList(); }

        currentAiBubble = addMessage('ai', '', true); // Initialize first bubble
        currentSegmentBuffer = ''; // Reset buffer

        const requestBody = { contents: currentChat.history };
        const userEnteredInstruction = currentSettings.systemInstruction.trim();
        const instructionToSend = userEnteredInstruction ? userEnteredInstruction : ACTUAL_DEFAULT_SYSTEM_INSTRUCTION;
        if (instructionToSend) { requestBody.systemInstruction = { parts: [{ text: instructionToSend }] }; console.log("Using System Instruction:", instructionToSend === ACTUAL_DEFAULT_SYSTEM_INSTRUCTION ? "(Default)" : "(User Provided)"); } else { console.log("No System Instruction sent."); }
        const generationConfig = {}; const topKVal = currentSettings.topK; if (topKVal > 0) { generationConfig.topK = topKVal; } else { generationConfig.temperature = currentSettings.temperature; generationConfig.topP = currentSettings.topP; } if (currentSettings.maxOutputTokens > 0) { generationConfig.maxOutputTokens = currentSettings.maxOutputTokens; } requestBody.generationConfig = generationConfig; if (currentSettings.searchEnabled) { requestBody.tools = [{ "googleSearch": {} }]; }

        let apiErrorOccurred = false;
        try {
            await streamApiResponse(
                requestBody,
                // *** REVISED onChunkReceived Logic ***
                (textChunk, isFinalChunk) => {
                    if (!currentAiBubble) { console.warn("onChunkReceived: No active bubble, creating."); currentAiBubble = addMessage('ai', '', true); currentSegmentBuffer = '';}

                    if (textChunk) { currentSegmentBuffer += textChunk; }

                    let splitIndex;
                    // Process segments ending in double newline
                    while ((splitIndex = currentSegmentBuffer.indexOf('\n\n')) !== -1) {
                        const paragraphText = currentSegmentBuffer.substring(0, splitIndex);
                        currentSegmentBuffer = currentSegmentBuffer.substring(splitIndex + 2); // Consume paragraph and \n\n

                        if (paragraphText.trim().length > 0) {
                            const formattedPara = escapeHtml(paragraphText).replace(/\n/g, '<br>');
                            currentAiBubble.paragraph.innerHTML = formattedPara; // Final content for this bubble
                            currentAiBubble.messageDiv.classList.remove('streaming');
                            requestAnimationFrame(() => { chatLog.scrollTop = chatLog.scrollHeight; });
                            // Create new bubble for next segment if buffer has content or stream not done
                            if (currentSegmentBuffer.trim().length > 0 || !isFinalChunk) {
                                console.log("Creating new bubble after paragraph break.");
                                currentAiBubble = addMessage('ai', '', true);
                            }
                        } else if (currentSegmentBuffer.trim().length > 0 || !isFinalChunk) {
                             // Handle consecutive \n\n, start new bubble if more content expected
                             console.log("Creating new bubble after empty paragraph break.");
                             currentAiBubble = addMessage('ai', '', true);
                        }
                    } // End while loop for \n\n

                    // After processing all \n\n, handle the final chunk signal
                    if (isFinalChunk) {
                        if (currentSegmentBuffer.length > 0) {
                            // Process the remaining buffer content into the current bubble
                            const formattedFinalSegment = escapeHtml(currentSegmentBuffer).replace(/\n/g, '<br>');
                            currentAiBubble.paragraph.innerHTML = formattedFinalSegment;
                            currentAiBubble.messageDiv.classList.remove('streaming');
                            requestAnimationFrame(() => { chatLog.scrollTop = chatLog.scrollHeight; });
                            currentSegmentBuffer = ''; // Clear buffer
                            console.log("Processed final segment in onChunkReceived.");
                        } else if (currentAiBubble.messageDiv.classList.contains('streaming')) {
                            // If buffer is empty but last bubble is still streaming, finalize it
                             currentAiBubble.messageDiv.classList.remove('streaming');
                             console.log("Finalized empty last bubble in onChunkReceived.");
                        }
                    }
                    // If not the final chunk, update the current bubble with the remaining buffer
                    else if (currentSegmentBuffer.length > 0) {
                        currentAiBubble.paragraph.innerHTML = escapeHtml(currentSegmentBuffer).replace(/\n/g, '<br>');
                         requestAnimationFrame(() => { chatLog.scrollTop = chatLog.scrollHeight; });
                    }
                },
                // *** onStreamEnd (Handles metadata on LAST bubble) ***
                (fullText, lastChunkData) => {
                    console.log("Stream ended hook. Full raw text:", fullText.length);
                    // Metadata should ideally be attached to the *last bubble containing actual content*.
                    // Find the last non-empty AI message bubble.
                    let lastContentBubble = null;
                    const aiMessages = chatLog.querySelectorAll('.message.ai-message:not(.error)');
                    if (aiMessages.length > 0) {
                        lastContentBubble = aiMessages[aiMessages.length - 1];
                         // Ensure it's finalized visually
                        if(lastContentBubble.classList.contains('streaming')) {
                            lastContentBubble.classList.remove('streaming');
                        }
                    } else {
                        console.warn("onStreamEnd: Could not find a suitable last AI bubble for metadata.");
                    }

                    // Add metadata to the identified last bubble
                    if (lastContentBubble) {
                         const wrapper = lastContentBubble.querySelector('.message-content-wrapper');
                         if (wrapper) {
                             // Handle Citations
                             const citationSources = lastChunkData?.candidates?.[0]?.citationMetadata?.citationSources;
                             if (citationSources?.length > 0) { const searchResults = citationSources.map(s => ({ uri: s.uri || '#', title: s.title || '', snippet: s.snippet || '', startIndex: s.startIndex, endIndex: s.endIndex })); console.log("Citations:", searchResults); const resultsContainer = createSearchResultsElement(searchResults); wrapper.appendChild(resultsContainer); }
                             else if (currentSettings.searchEnabled) { console.log("Search on, no citations."); }

                             // Handle Generated Image
                             const imagePart = lastChunkData?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                             if (imagePart?.inlineData?.mimeType?.startsWith('image/')) { console.log("Found generated image."); const imgContainer = document.createElement('div'); imgContainer.classList.add('generated-image-container'); const img = document.createElement('img'); img.classList.add('generated-image'); img.src = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`; img.alt = "Generated"; img.onclick = () => window.open(img.src, '_blank'); imgContainer.appendChild(img); wrapper.appendChild(imgContainer); }

                             // Add Preview Button
                            const parts = fullText.split(/(```[\s\S]*?```)/); let containsPreviewableCode = false; const codeBlocksForPreview = []; parts.forEach((part)=>{if(part.startsWith('```')&&part.endsWith('```')){const langMatch=part.match(/^```(\w*)\n?/);const lang=langMatch?langMatch[1].toLowerCase():'plaintext';let codeContent='';const firstNewlineIndex=part.indexOf('\n');if(firstNewlineIndex!==-1){codeContent=part.substring(firstNewlineIndex+1,part.length-3).trimEnd();}else{codeContent=part.substring(3,part.length-3);} if(['html','css','javascript','js'].includes(lang)||(lang==='plaintext'&&(/<[^>]+>/.test(codeContent.substring(0,200))||/[{};]/.test(codeContent.substring(0,200))))){containsPreviewableCode=true;codeBlocksForPreview.push({lang:lang,content:codeContent});}}else if(part.trim()!==''){ if(/<html\b|<body\b|<style\b|<script\b/i.test(part.substring(0,200))){if(!containsPreviewableCode){containsPreviewableCode=true;codeBlocksForPreview.push({lang:'html',content:part});}}}});
                            if (containsPreviewableCode && codeBlocksForPreview.length > 0) { /* ... preview button logic ... */ const previewContainer = document.createElement('div'); previewContainer.classList.add('preview-button-container'); const previewButton = document.createElement('button'); previewButton.classList.add('preview-button'); previewButton.innerHTML = `<span class="material-symbols-outlined">visibility</span> 预览`; previewButton.title = "预览代码"; previewButton.onclick = () => { try { let pC = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Code Preview</title>'; let s = '', scr = '', bC = ''; codeBlocksForPreview.forEach(b => { if (b.lang==='css'){s+=b.content+'\n';}else if(['javascript','js'].includes(b.lang)){scr+=b.content+'\n';}else{bC+=b.content+'\n';} }); if(s){pC+='<style>\n'+s+'</style>';} pC+='</head><body>'+bC; if(scr){pC+='<script>document.addEventListener("DOMContentLoaded",()=>{try{'+scr+'}catch(e){console.error("Preview Error:",e);alert("Script error:"+e.message);}});</script>';} pC+='</body></html>'; const blob = new Blob([pC],{type:'text/html'}); const url=URL.createObjectURL(blob); const pW=window.open(url,'_blank','noopener,noreferrer'); setTimeout(()=>URL.revokeObjectURL(url),2000); if(!pW){alert('无法打开预览窗口。');}} catch (e) { console.error("Preview Err:", e); alert('创建预览出错: '+e.message); } }; previewContainer.appendChild(previewButton); wrapper.appendChild(previewContainer); } // Append to last bubble's wrapper
                            requestAnimationFrame(() => { chatLog.scrollTop = chatLog.scrollHeight; }); // Scroll after adding metadata
                         } else {
                             console.error("onStreamEnd: Could not find content wrapper in the last identified bubble.");
                         }
                    }

                    // Update history with the SINGLE, FULL response text
                    const modelParts = [{ text: fullText }];
                    const imagePartForHistory = lastChunkData?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                    if (imagePartForHistory?.inlineData?.mimeType?.startsWith('image/')) { modelParts.push(imagePartForHistory); }
                    const chatToUpdate = allChats.find(c => c.id === currentChatId); if (chatToUpdate) { if (!chatToUpdate.history) chatToUpdate.history = []; chatToUpdate.history.push({ role: 'model', parts: modelParts }); saveChats(); } else { console.error("CRITICAL: Chat disappeared before saving model response!"); }

                    currentAiBubble = null; // Clear state for next turn
                },
                // onError
                (errorMessage) => {
                    if (currentAiBubble) { /* Add error to current bubble */ currentAiBubble.messageDiv.classList.remove('streaming'); currentAiBubble.messageDiv.classList.add('error'); currentAiBubble.paragraph.innerText = `错误: ${errorMessage}`; requestAnimationFrame(() => { chatLog.scrollTop = chatLog.scrollHeight; }); }
                    else { /* Fallback if no bubble */ addMessage('ai', `错误: ${errorMessage}`); }
                    apiErrorOccurred = true;
                    currentAiBubble = null; // Clear state
                }
            ); // End streamApiResponse call
        } catch (error) {
             console.error("processAndSendMessage caught error:", error);
             apiErrorOccurred = true;
             if (currentAiBubble) { /* Try show error in bubble */ currentAiBubble.messageDiv.classList.remove('streaming'); currentAiBubble.messageDiv.classList.add('error'); currentAiBubble.paragraph.innerText = `错误: ${error.message || '请求失败'}`; }
             else { addMessage('ai', `错误: ${error.message || '请求失败'}`); }
             currentAiBubble = null; // Clear state
        }

        if (apiErrorOccurred && isAutoSend) {
            stopAutoSend();
            alert("快捷发送因API错误已停止。");
        }

    } // End processAndSendMessage


    // --- Auto-Send Logic ---
    function startAutoSend() { if (isAutoSending) return; const text = autoSendInput.value.trim(); const intervalSeconds = parseInt(autoSendIntervalInput.value, 10); if (!text) { alert("请输入要快捷发送的内容。"); return; } if (isNaN(intervalSeconds) || intervalSeconds < 1) { alert("请输入有效的发送间隔（秒，至少为1）。"); return; } isAutoSending = true; autoSendButton.textContent = "停止发送"; autoSendButton.classList.add('active'); autoSendIntervalInput.disabled = true; autoSendInput.disabled = true; console.log(`Starting auto-send every ${intervalSeconds} seconds.`); processAndSendMessage(text, [], true); if (isAutoSending) { autoSendIntervalId = setInterval(() => { const currentText = autoSendInput.value.trim(); if (!currentText || !isAutoSending) { console.warn("Auto-send text empty or stopped, clearing interval."); stopAutoSend(); return; } processAndSendMessage(currentText, [], true); }, intervalSeconds * 1000); } else { stopAutoSend(); } }
    function stopAutoSend() { if (!isAutoSending && !autoSendIntervalId) return; console.log("Stopping auto-send."); if (autoSendIntervalId) { clearInterval(autoSendIntervalId); autoSendIntervalId = null; } isAutoSending = false; autoSendButton.textContent = "开始发送"; autoSendButton.classList.remove('active'); autoSendIntervalInput.disabled = false; autoSendInput.disabled = false; }

    // --- Layout Resizing Logic ---
    function saveLayoutWidths() { localStorage.setItem(LAYOUT_WIDTH_LEFT_KEY, historySidebar.style.width); localStorage.setItem(LAYOUT_WIDTH_RIGHT_KEY, settingsSidebar.style.width); }
    function loadLayoutWidths() { const leftWidth = localStorage.getItem(LAYOUT_WIDTH_LEFT_KEY); const rightWidth = localStorage.getItem(LAYOUT_WIDTH_RIGHT_KEY); if (leftWidth && /^\d+px$/.test(leftWidth)) { historySidebar.style.width = leftWidth; } else { historySidebar.style.width = '260px'; } if (rightWidth && /^\d+px$/.test(rightWidth)) { settingsSidebar.style.width = rightWidth; } else { settingsSidebar.style.width = '300px'; } console.log(`Layout loaded: Left=${historySidebar.style.width}, Right=${settingsSidebar.style.width}`); }
    function makeResizable(resizerElement, leftElement, rightElement) { let startX, startLeftWidth, startRightWidth; let isResizing = false; const onMouseMove = (e) => { if (!isResizing) return; const currentX = e.clientX; const deltaX = currentX - startX; let newLeftWidth = startLeftWidth + deltaX; let newRightWidth = startRightWidth - deltaX; const minRightElementWidth = (rightElement === centerContent) ? MIN_CENTER_WIDTH : MIN_SIDEBAR_WIDTH; const minLeftElementWidth = (leftElement === centerContent) ? MIN_CENTER_WIDTH : MIN_SIDEBAR_WIDTH; if (newLeftWidth < minLeftElementWidth) { newLeftWidth = minLeftElementWidth; newRightWidth = startLeftWidth + startRightWidth - newLeftWidth; if (newRightWidth < minRightElementWidth) newRightWidth = minRightElementWidth; } else if (newRightWidth < minRightElementWidth) { newRightWidth = minRightElementWidth; newLeftWidth = startLeftWidth + startRightWidth - newRightWidth; if (newLeftWidth < minLeftElementWidth) newLeftWidth = minLeftElementWidth; } if (newLeftWidth + newRightWidth > startLeftWidth + startRightWidth) { if (deltaX > 0 && leftElement !== centerContent) { newLeftWidth = Math.min(newLeftWidth, startLeftWidth + startRightWidth - minRightElementWidth); newRightWidth = startLeftWidth + startRightWidth - newLeftWidth; } else if (deltaX < 0 && rightElement !== centerContent){ newRightWidth = Math.min(newRightWidth, startLeftWidth + startRightWidth - minLeftElementWidth); newLeftWidth = startLeftWidth + startRightWidth - newRightWidth; } } leftElement.style.width = `${newLeftWidth}px`; if (rightElement === settingsSidebar || leftElement === settingsSidebar) { settingsSidebar.style.width = `${newRightWidth}px`; } if (leftElement === historySidebar || rightElement === historySidebar) { historySidebar.style.width = `${newLeftWidth}px`; } }; const onMouseUp = () => { if (!isResizing) return; isResizing = false; resizerElement.classList.remove('active'); document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; saveLayoutWidths(); console.log("Resizing ended"); }; resizerElement.addEventListener('mousedown', (e) => { if (window.innerWidth <= 768) return; e.preventDefault(); isResizing = true; startX = e.clientX; startLeftWidth = leftElement.offsetWidth; startRightWidth = rightElement.offsetWidth; resizerElement.classList.add('active'); document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; console.log("Resizing started"); }); }

    // --- Mobile Sidebar Toggle Logic ---
    function createOverlay() { if (document.getElementById('mobile-overlay')) { overlay = document.getElementById('mobile-overlay'); } else { overlay = document.createElement('div'); overlay.id = 'mobile-overlay'; overlay.classList.add('overlay'); appWrapper.prepend(overlay); console.log("Overlay created."); } overlay.removeEventListener('click', handleOverlayClick); overlay.addEventListener('click', handleOverlayClick); }
    function handleOverlayClick() { console.log("Overlay clicked!"); closeSidebars(); }
    function toggleSidebar(sidebarElement, stateKey) { const isOpen = window[stateKey]; const shouldOpen = !isOpen; if (shouldOpen) { if (sidebarElement === historySidebar && isSettingsSidebarOpen) { settingsSidebar.classList.remove('open'); isSettingsSidebarOpen = false; } else if (sidebarElement === settingsSidebar && isHistorySidebarOpen) { historySidebar.classList.remove('open'); isHistorySidebarOpen = false; } } sidebarElement.classList.toggle('open', shouldOpen); window[stateKey] = shouldOpen; const anySidebarOpen = isHistorySidebarOpen || isSettingsSidebarOpen; if (overlay) { overlay.classList.toggle('active', anySidebarOpen); console.log("Overlay active state:", overlay.classList.contains('active')); } else { console.error("Overlay element not found when toggling!"); createOverlay(); if(overlay) overlay.classList.toggle('active', anySidebarOpen); } console.log(`${sidebarElement.id} ${shouldOpen ? 'opened' : 'closed'}`); }
    function closeSidebars() { let closedSomething = false; if (isHistorySidebarOpen) { historySidebar.classList.remove('open'); isHistorySidebarOpen = false; closedSomething = true; console.log("Closed history sidebar"); } if (isSettingsSidebarOpen) { settingsSidebar.classList.remove('open'); isSettingsSidebarOpen = false; closedSomething = true; console.log("Closed settings sidebar"); } if (overlay && overlay.classList.contains('active')) { overlay.classList.remove('active'); console.log("Deactivated overlay"); } }

    // --- Event Handlers ---
    function handleManualSend() { const userText = userInput.value.trim(); const imageParts = uploadedFilesData.map(file => { const base64DataOnly = file.base64Data.split(',')[1]; if (base64DataOnly) return { inlineData: { mimeType: file.mimeType, data: base64DataOnly } }; console.warn(`Cannot extract base64 ${file.name}`); addMessage('system', `错误：无法处理图片 ${file.name}。`); return null; }).filter(part => part !== null); if (userText === '' && imageParts.length === 0) return; processAndSendMessage(userText, imageParts, false); userInput.value = ''; imagePreviewArea.innerHTML = ''; uploadedFilesData = []; userInput.focus(); }

    // --- Event Listeners ---
    // Settings & Theme
    systemInstructionInput.addEventListener('change', (event) => { currentSettings.systemInstruction = event.target.value; localStorage.setItem('googleAiSystemInstruction', currentSettings.systemInstruction); console.log("User System Instruction saved:", currentSettings.systemInstruction || '(empty)'); });
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
    toggleHistoryButton.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(historySidebar, 'isHistorySidebarOpen'); });
    toggleSettingsButton.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(settingsSidebar, 'isSettingsSidebarOpen'); });
    // Center Content Click to Close Mobile Sidebars
    centerContent.addEventListener('click', () => { if (isHistorySidebarOpen || isSettingsSidebarOpen) { console.log("Center content clicked while sidebar open, closing sidebars."); closeSidebars(); } });
    // Other UI
    modelSelector.addEventListener('change', (event) => { currentModelId = event.target.value; localStorage.setItem('selectedGoogleAiModel', currentModelId); });
    saveKeyButton.addEventListener('click', () => { const newKey = apiKeyInput.value.trim(); API_KEY = newKey; if (newKey) { localStorage.setItem('googleAiApiKey', API_KEY); alert('API Key 已保存。'); } else { localStorage.removeItem('googleAiApiKey'); API_KEY = DEFAULT_API_KEY; alert('API Key 已清除，将使用默认Key（如果存在）。'); } apiKeyInput.value = newKey; apiKeyInput.type = 'password'; console.log(`API Key Updated: Using ${API_KEY === DEFAULT_API_KEY ? 'Default Key' : 'User Saved Key'}`); });
    apiKeyInput.addEventListener('focus', () => { apiKeyInput.type = 'text'; });
    apiKeyInput.addEventListener('blur', () => { apiKeyInput.type = 'password'; });
    uploadButton.addEventListener('click', () => { imageUploadInput.click(); });
    imageUploadInput.addEventListener('change', (event) => { const files = event.target.files; if (!files || files.length === 0) return; const maxFiles = 5; if (uploadedFilesData.length + files.length > maxFiles) { alert(`最多上传 ${maxFiles} 张图片。`); imageUploadInput.value = ''; return; } const filePromises = Array.from(files).map(file => { return new Promise((resolve, reject) => { if (!file.type.startsWith('image/')) { alert(`文件 "${file.name}" 非图片。`); return resolve(null); } const maxSizeMB = 4; if (file.size > maxSizeMB * 1024 * 1024) { alert(`图片 "${file.name}" 超出 ${maxSizeMB}MB。`); return resolve(null); } if (uploadedFilesData.some(f => f.name === file.name)) { alert(`图片 "${file.name}" 已添加。`); return resolve(null); } const reader = new FileReader(); reader.onload = (e) => { resolve({ name: file.name, mimeType: file.type, base64Data: e.target.result }); }; reader.onerror = (error) => { console.error("Read Error:", error); alert(`读取 "${file.name}" 出错。`); reject(error); }; reader.readAsDataURL(file); }); }); Promise.all(filePromises).then(results => { results.forEach(fileData => { if (fileData) { uploadedFilesData.push(fileData); displayImagePreview(fileData); } }); }).catch(error => { console.error("File processing error:", error); }).finally(() => { imageUploadInput.value = ''; }); });
    // Window Resize Listener
     window.addEventListener('resize', () => {
         if (window.innerWidth > 768) { closeSidebars(); }
     });


    // --- Initial Load Sequence ---
    loadLayoutWidths(); // 1. Load layout widths FIRST
    loadChats();        // 2. Load chat data
    initializeUI();     // 3. Setup UI elements & Load theme preference
    renderChatList();   // 4. Display loaded chats in sidebar
    if (currentChatId && allChats.some(c => c.id === currentChatId)) { switchChat(currentChatId); } else { startNewChat(); } // 5. Activate chat or start new
    makeResizable(resizerLeft, historySidebar, centerContent); makeResizable(resizerRight, centerContent, settingsSidebar); // 6. Initialize Resizers
    createOverlay();    // 7. Create Mobile Overlay
    userInput.focus();  // 8. Focus input
    console.log("Chat interface initialized (Final Version with Multi-Bubble Fix).");

}); // End DOMContentLoaded listener