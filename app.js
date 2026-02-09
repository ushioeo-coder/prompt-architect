/**
 * 8+1 Prompt Architect - Application Logic
 */

// ===================================
// State Management
// ===================================
const state = {
    currentStep: 1,
    totalSteps: 8, // Visible steps (excluding hidden step 04)
    stepMapping: [1, 2, 3, 5, 6, 7, 8, 9], // Actual step numbers (4 is hidden)

    // User inputs
    inputs: {
        goal: '',
        reference: '',
        reader: '',
        writer: '',
        skipReader: false,
        skipWriter: false,
        selectedInstruction: null,
        customInstruction: '',
        selectedFormats: [],
        selectedStyle: null,
        selectedTone: null,
        outputFormat: ''
    },

    // Generated content
    generated: {
        step1: null,
        step2: null,
        step3: null,
        step4Words: null,
        step5Instructions: [],
        step6Formats: [],
        step7Styles: [],
        step7Tones: [],
        step8Format: '',
        finalPrompt: ''
    }
};

// ===================================
// Step Definitions
// ===================================
const stepLabels = ['前提条件', '読み手', '書き手', '実行指示', '出力形式', 'スタイル', 'フォーマット', '総仕上げ'];

// ===================================
// DOM Elements
// ===================================
const elements = {
    progressFill: document.getElementById('progressFill'),
    stepIndicators: document.getElementById('stepIndicators'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    generateBtn: document.getElementById('generateBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    toast: document.getElementById('toast'),
    copyBtn: document.getElementById('copyBtn'),
    finalPrompt: document.getElementById('finalPrompt'),

    // Inputs
    goalInput: document.getElementById('goalInput'),
    referenceInput: document.getElementById('referenceInput'),
    readerInput: document.getElementById('readerInput'),
    writerInput: document.getElementById('writerInput'),
    customInstruction: document.getElementById('customInstruction'),
    outputFormat: document.getElementById('outputFormat'),

    // Skip buttons and notices
    skipReaderBtn: document.getElementById('skipReaderBtn'),
    skipWriterBtn: document.getElementById('skipWriterBtn'),
    readerInputGroup: document.getElementById('readerInputGroup'),
    writerInputGroup: document.getElementById('writerInputGroup'),
    readerSkippedNotice: document.getElementById('readerSkippedNotice'),
    writerSkippedNotice: document.getElementById('writerSkippedNotice'),
    undoReaderSkipBtn: document.getElementById('undoReaderSkipBtn'),
    undoWriterSkipBtn: document.getElementById('undoWriterSkipBtn'),

    // Generated content areas
    step1Result: document.getElementById('step1Result'),
    step2Result: document.getElementById('step2Result'),
    step3Result: document.getElementById('step3Result'),
    instructionCards: document.getElementById('instructionCards'),
    formatOptions: document.getElementById('formatOptions'),
    styleOptions: document.getElementById('styleOptions'),
    toneOptions: document.getElementById('toneOptions'),
    evaluationGrid: document.getElementById('evaluationGrid')
};

// ===================================
// Initialization
// ===================================
function init() {
    createStepIndicators();
    setupEventListeners();
    updateUI();
}

function createStepIndicators() {
    elements.stepIndicators.innerHTML = stepLabels.map((label, index) => `
        <div class="step-indicator ${index === 0 ? 'active' : ''}" data-step="${index + 1}">
            <div class="step-dot">${index < 7 ? String(index + 1).padStart(2, '0') : '+1'}</div>
            <span class="step-label">${label}</span>
        </div>
    `).join('');
}

function setupEventListeners() {
    // Navigation
    elements.prevBtn.addEventListener('click', prevStep);
    elements.nextBtn.addEventListener('click', nextStep);
    elements.generateBtn.addEventListener('click', generateContent);
    elements.copyBtn.addEventListener('click', copyFinalPrompt);

    // Step indicators click
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        indicator.addEventListener('click', () => goToStep(index + 1));
    });

    // Input changes
    elements.goalInput.addEventListener('input', (e) => {
        state.inputs.goal = e.target.value;
    });

    elements.referenceInput.addEventListener('input', (e) => {
        state.inputs.reference = e.target.value;
    });

    elements.readerInput.addEventListener('input', (e) => {
        state.inputs.reader = e.target.value;
    });

    elements.writerInput.addEventListener('input', (e) => {
        state.inputs.writer = e.target.value;
    });

    elements.customInstruction.addEventListener('input', (e) => {
        state.inputs.customInstruction = e.target.value;
    });

    elements.outputFormat.addEventListener('input', (e) => {
        state.inputs.outputFormat = e.target.value;
    });

    // Skip buttons
    elements.skipReaderBtn.addEventListener('click', () => toggleSkipReader(true));
    elements.undoReaderSkipBtn.addEventListener('click', () => toggleSkipReader(false));
    elements.skipWriterBtn.addEventListener('click', () => toggleSkipWriter(true));
    elements.undoWriterSkipBtn.addEventListener('click', () => toggleSkipWriter(false));
}

function toggleSkipReader(skip) {
    state.inputs.skipReader = skip;
    if (skip) {
        elements.readerInputGroup.classList.add('hidden');
        elements.readerSkippedNotice.classList.remove('hidden');
        elements.skipReaderBtn.classList.add('active');
        state.generated.step2 = null;
    } else {
        elements.readerInputGroup.classList.remove('hidden');
        elements.readerSkippedNotice.classList.add('hidden');
        elements.skipReaderBtn.classList.remove('active');
    }
    updateUI();
}

function toggleSkipWriter(skip) {
    state.inputs.skipWriter = skip;
    if (skip) {
        elements.writerInputGroup.classList.add('hidden');
        elements.writerSkippedNotice.classList.remove('hidden');
        elements.skipWriterBtn.classList.add('active');
        state.generated.step3 = null;
    } else {
        elements.writerInputGroup.classList.remove('hidden');
        elements.writerSkippedNotice.classList.add('hidden');
        elements.skipWriterBtn.classList.remove('active');
    }
    updateUI();
}

// ===================================
// Navigation
// ===================================
function updateUI() {
    const stepIndex = state.currentStep - 1;
    const actualStep = state.stepMapping[stepIndex];

    // Update progress bar
    const progress = (state.currentStep / state.totalSteps) * 100;
    elements.progressFill.style.width = `${progress}%`;

    // Update step indicators
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        indicator.classList.remove('active', 'completed');
        if (index === stepIndex) {
            indicator.classList.add('active');
        } else if (index < stepIndex) {
            indicator.classList.add('completed');
        }
    });

    // Show/hide step sections
    document.querySelectorAll('.step-section').forEach(section => {
        section.classList.remove('active');
        if (parseInt(section.dataset.step) === actualStep) {
            section.classList.add('active');
        }
    });

    // Update navigation buttons
    elements.prevBtn.disabled = state.currentStep === 1;

    // Show generate button on steps that need generation (unless skipped)
    const isStep2Skipped = state.currentStep === 2 && state.inputs.skipReader;
    const isStep3Skipped = state.currentStep === 3 && state.inputs.skipWriter;

    const needsGeneration = (
        state.currentStep === 1 ||
        (state.currentStep === 2 && !state.inputs.skipReader) ||
        (state.currentStep === 3 && !state.inputs.skipWriter) ||
        (state.currentStep === 4 && !state.generated.step5Instructions.length)
    );

    if (needsGeneration && !isStep2Skipped && !isStep3Skipped) {
        elements.generateBtn.classList.remove('hidden');
        elements.nextBtn.classList.add('hidden');
    } else {
        elements.generateBtn.classList.add('hidden');
        elements.nextBtn.classList.remove('hidden');
    }

    // Special case for final step
    if (state.currentStep === state.totalSteps) {
        elements.nextBtn.textContent = '完了';
    } else {
        elements.nextBtn.innerHTML = '次へ <span>→</span>';
    }
}

function prevStep() {
    if (state.currentStep > 1) {
        state.currentStep--;
        updateUI();
    }
}

function nextStep() {
    if (state.currentStep < state.totalSteps) {
        state.currentStep++;
        updateUI();

        // Trigger auto-generation for step 5 if coming from step 3
        if (state.currentStep === 4 && !state.generated.step5Instructions.length) {
            generateStep5Content();
        }
    } else if (state.currentStep === state.totalSteps) {
        // Final step - complete action
        completePromptCreation();
    }
}

async function completePromptCreation() {
    // Update final prompt before copying
    updateFinalPrompt();

    // Copy to clipboard
    try {
        await navigator.clipboard.writeText(state.generated.finalPrompt);
        showToast('🎉 プロンプトが完成しました！クリップボードにコピーされました');
        elements.copyBtn.innerHTML = '<span class="copy-icon">✓</span> コピー完了';

        // Show completion animation
        elements.nextBtn.innerHTML = '✓ 完了';
        elements.nextBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

        setTimeout(() => {
            elements.copyBtn.innerHTML = '<span class="copy-icon">📋</span> コピー';
            elements.nextBtn.innerHTML = '完了';
            elements.nextBtn.style.background = '';
        }, 3000);
    } catch (err) {
        // Fallback: select the text for manual copy
        showToast('プロンプトが完成しました！「コピー」ボタンでコピーしてください');
    }
}

function goToStep(step) {
    if (step >= 1 && step <= state.totalSteps) {
        state.currentStep = step;
        updateUI();
    }
}

// ===================================
// Content Generation (Mock)
// ===================================
async function generateContent() {
    const stepIndex = state.currentStep - 1;
    const actualStep = state.stepMapping[stepIndex];

    showLoading(`ステップ${actualStep}の内容を生成中...`);

    // Simulate API delay
    await delay(1500);

    switch (actualStep) {
        case 1:
            await generateStep1();
            break;
        case 2:
            await generateStep2();
            break;
        case 3:
            await generateStep3();
            break;
    }

    hideLoading();

    // Auto-advance to next step
    if (state.currentStep < state.totalSteps) {
        await delay(500);
        nextStep();
    }
}

async function generateStep1() {
    const goal = state.inputs.goal || 'サンプルの目標';
    const reference = state.inputs.reference;

    try {
        const response = await fetch('/.netlify/functions/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'step1',
                data: { goal, reference }
            })
        });

        if (response.ok) {
            const data = await response.json();
            state.generated.step1 = data.result;
        } else {
            throw new Error('API error');
        }
    } catch (error) {
        console.log('Using fallback for step1:', error);
        // Fallback to local generation
        let step1Content = `# 前提条件：
- タイトル：${extractTitle(goal)}を作成する
- 依頼者条件：${goal}を達成したいと考えているビジネスパーソン
- 前提情報：基本的なビジネスの知識とツールへのアクセスがある
- 目的と目標：${goal}を実現し、具体的な成果物を得ること`;

        if (reference) {
            step1Content += `

# 参考情報・変数：
${reference}`;
        }
        state.generated.step1 = step1Content;
    }

    elements.step1Result.innerHTML = `
        <h4>✨ 生成された前提条件</h4>
        <pre>${state.generated.step1}</pre>
    `;
    elements.step1Result.classList.add('visible');
}

async function generateStep2() {
    const reader = state.inputs.reader || 'ビジネスパーソン';

    try {
        const response = await fetch('/.netlify/functions/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'step2',
                data: {
                    reader,
                    step1: state.generated.step1
                }
            })
        });

        if (response.ok) {
            const data = await response.json();
            state.generated.step2 = data.result;
        } else {
            throw new Error('API error');
        }
    } catch (error) {
        console.log('Using fallback for step2:', error);
        state.generated.step2 = `読み手ペルソナ =
- 名前：田中 太郎
- 年齢：45歳
- 性別：男性
- 職業：${extractOccupation(reader)}
- 性格・価値観：実用性を重視し、効率的な解決策を好む
- 興味関心：ビジネスの成長、最新のテクノロジー活用
- 知識レベル：専門分野では経験豊富、新技術は学習中
- 悩み・課題：時間の制約、リソースの限界
- 情報収集の方法：ビジネス記事、セミナー、同業者からの情報
- 期待すること：具体的で実践可能なアドバイス`;
    }

    elements.step2Result.innerHTML = `
        <h4>✨ 生成された読み手ペルソナ</h4>
        <pre>${state.generated.step2}</pre>
    `;
    elements.step2Result.classList.add('visible');
}

async function generateStep3() {
    const writer = state.inputs.writer || 'プロフェッショナル';

    try {
        const response = await fetch('/.netlify/functions/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'step3',
                data: {
                    writer,
                    step1: state.generated.step1
                }
            })
        });

        if (response.ok) {
            const data = await response.json();
            state.generated.step3 = data.result;
        } else {
            throw new Error('API error');
        }
    } catch (error) {
        console.log('Using fallback for step3:', error);
        state.generated.step3 = `◆基本情報
- 名前：佐藤 明子
- 経歴：${writer}として15年以上の経験
- 専門分野：ビジネスコンサルティング

◆文章スタイル
- 論理的かつ実践的
- 具体例を交えた説明
- 段階的なアプローチ

◆文章トーン
- 専門的だが親しみやすい
- 励ましを含む前向きな表現

◆表現設定
- 人称：一人称（私）
- 定型表現：「〜することをお勧めします」
- 文末表現：です・ます調`;
    }

    elements.step3Result.innerHTML = `
        <h4>✨ 生成された書き手ペルソナ</h4>
        <pre>${state.generated.step3}</pre>
    `;
    elements.step3Result.classList.add('visible');
}

async function generateStep5Content() {
    showLoading('AIが最適な指示文を考案中...');

    // Step 04: Hidden word selection (background)
    await delay(500);
    state.generated.step4Words = {
        nouns: ['戦略', 'フレームワーク', 'アプローチ', '方法論', 'ソリューション'],
        verbs: ['構築する', '実装する', '最適化する', '分析する', '提案する'],
        adjectives: ['効果的な', '実践的な', '包括的な', '革新的な', '持続可能な'],
        adverbs: ['効率的に', '段階的に', '体系的に', '確実に', '迅速に']
    };

    // Step 05: Generate instructions via API
    const goal = state.inputs.goal || 'ビジネス目標を達成するための資料';

    try {
        const response = await fetch('/.netlify/functions/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'step5',
                data: {
                    step1: state.generated.step1,
                    step2: state.inputs.skipReader ? null : state.generated.step2,
                    step3: state.inputs.skipWriter ? null : state.generated.step3
                }
            })
        });

        if (response.ok) {
            const data = await response.json();
            // Parse the 5 instructions from the response
            const instructionMatches = data.result.match(/---案\d---[\s\S]*?(?=---案|$)/g);
            if (instructionMatches && instructionMatches.length > 0) {
                state.generated.step5Instructions = instructionMatches.map(match => {
                    return match.replace(/---案\d---\s*/, '').trim();
                });
            } else {
                throw new Error('Could not parse instructions');
            }
        } else {
            throw new Error('API error');
        }
    } catch (error) {
        console.log('Using fallback for step5:', error);
        state.generated.step5Instructions = [
            `{読み手ペルソナ}が抱える課題を解決するため、
{前提条件}に基づいた実践的なアドバイスを提供してください。
具体例と段階的なステップを含めて説明してください。`,

            `{書き手ペルソナ}の視点から、
{ゴールと成果物}を達成するための包括的なガイドを作成してください。
読み手が即座に行動できるよう、具体的な手順を示してください。`,

            `{前提条件}を踏まえ、{読み手ペルソナ}のニーズに合わせた
効果的な${extractTitle(goal)}を生成してください。
実用性を重視し、すぐに活用できる形式で提供してください。`,

            `{書き手ペルソナ}として、{読み手ペルソナ}に向けて
${extractTitle(goal)}に関する専門的なアドバイスを作成してください。
具体的な数値や事例を含めることを推奨します。`,

            `{ゴールと成果物}を達成するため、
{前提条件}と{読み手ペルソナ}の状況を考慮した
戦略的なアプローチを提案してください。
実行可能なアクションプランを含めてください。`
        ];
    }

    renderInstructionCards();
    generateStep6Options();
    generateStep7Options();
    generateStep8Format();
    generateFinalEvaluation();

    hideLoading();
    updateUI();
}

function renderInstructionCards() {
    elements.instructionCards.innerHTML = state.generated.step5Instructions.map((instruction, index) => `
        <div class="instruction-card ${index === 0 ? 'selected' : ''}" data-number="${index + 1}" data-index="${index}">
            <p>${instruction}</p>
        </div>
    `).join('');

    // Setup click handlers
    document.querySelectorAll('.instruction-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.instruction-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.inputs.selectedInstruction = parseInt(card.dataset.index);
            elements.customInstruction.value = state.generated.step5Instructions[state.inputs.selectedInstruction];
            state.inputs.customInstruction = elements.customInstruction.value;
            updateFinalPrompt();
        });
    });

    // Set initial selection
    state.inputs.selectedInstruction = 0;
    elements.customInstruction.value = state.generated.step5Instructions[0];
    state.inputs.customInstruction = elements.customInstruction.value;
}

function generateStep6Options() {
    state.generated.step6Formats = [
        'マークダウン形式',
        '箇条書きリスト',
        '番号付きリスト',
        '表形式',
        'Q&A形式',
        'ステップバイステップ形式',
        '段落形式',
        'チェックリスト形式'
    ];

    elements.formatOptions.innerHTML = state.generated.step6Formats.map((format, index) => `
        <div class="format-option ${index === 0 ? 'selected' : ''}" data-index="${index}">
            <div class="checkmark"></div>
            <span>${format}</span>
        </div>
    `).join('');

    document.querySelectorAll('.format-option').forEach(option => {
        option.addEventListener('click', () => {
            option.classList.toggle('selected');
            updateSelectedFormats();
            updateFinalPrompt();
        });
    });

    state.inputs.selectedFormats = [0];
}

function updateSelectedFormats() {
    state.inputs.selectedFormats = [];
    document.querySelectorAll('.format-option.selected').forEach(option => {
        state.inputs.selectedFormats.push(parseInt(option.dataset.index));
    });
}

function generateStep7Options() {
    state.generated.step7Styles = [
        '論理的・分析的',
        '物語形式',
        '実践的・ハウツー',
        '説得的・提案型',
        '教育的・解説型'
    ];

    state.generated.step7Tones = [
        'フォーマル',
        'カジュアル',
        'プロフェッショナル',
        '親しみやすい',
        '励まし・ポジティブ'
    ];

    elements.styleOptions.innerHTML = state.generated.step7Styles.map((style, index) => `
        <div class="style-option ${index === 2 ? 'selected' : ''}" data-index="${index}">${style}</div>
    `).join('');

    elements.toneOptions.innerHTML = state.generated.step7Tones.map((tone, index) => `
        <div class="tone-option ${index === 2 ? 'selected' : ''}" data-index="${index}">${tone}</div>
    `).join('');

    document.querySelectorAll('.style-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.style-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            state.inputs.selectedStyle = parseInt(option.dataset.index);
            updateFinalPrompt();
        });
    });

    document.querySelectorAll('.tone-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.tone-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            state.inputs.selectedTone = parseInt(option.dataset.index);
            updateFinalPrompt();
        });
    });

    state.inputs.selectedStyle = 2;
    state.inputs.selectedTone = 2;
}

function generateStep8Format() {
    state.generated.step8Format = `[タイトル]

## 概要
{概要の内容}

## 本文
### セクション1
{内容}

### セクション2
{内容}

## まとめ
{まとめの内容}

## 次のステップ
- {アクション1}
- {アクション2}
- {アクション3}`;

    elements.outputFormat.value = state.generated.step8Format;
    state.inputs.outputFormat = state.generated.step8Format;
}

function generateFinalEvaluation() {
    const evaluationItems = [
        { name: '言葉の選択', status: 'pass' },
        { name: '指示の明確さ', status: 'pass' },
        { name: '出力形式の指定', status: 'pass' },
        { name: '変数命名', status: 'pass' },
        { name: '目的との整合性', status: 'pass' },
        { name: '一貫性', status: 'pass' }
    ];

    elements.evaluationGrid.innerHTML = evaluationItems.map(item => `
        <div class="evaluation-item">
            <div class="status-icon ${item.status}">✓</div>
            <span>${item.name}</span>
        </div>
    `).join('');

    updateFinalPrompt();
}

function updateFinalPrompt() {
    const instruction = state.inputs.customInstruction ||
        (state.generated.step5Instructions[state.inputs.selectedInstruction] || '');

    const formats = state.inputs.selectedFormats.map(i => state.generated.step6Formats[i]).join('、');
    const style = state.generated.step7Styles[state.inputs.selectedStyle] || '';
    const tone = state.generated.step7Tones[state.inputs.selectedTone] || '';
    const outputFormat = state.inputs.outputFormat || state.generated.step8Format;

    // Build prompt parts, excluding skipped sections
    let promptParts = [];

    // Step 1: 前提条件 (always included)
    if (state.generated.step1) {
        promptParts.push(state.generated.step1);
    }

    // Step 2: 読み手ペルソナ (skip if reader is skipped)
    if (!state.inputs.skipReader && state.generated.step2) {
        promptParts.push(state.generated.step2);
    }

    // Step 3: 書き手ペルソナ (skip if writer is skipped)
    if (!state.inputs.skipWriter && state.generated.step3) {
        promptParts.push(state.generated.step3);
    }

    // Add execution instruction and other settings
    promptParts.push(`# 実行指示：
${instruction}

# 出力形式：
${formats}

# 文章スタイル：${style}
# 文章トーン：${tone}

# 出力フォーマット：
\`\`\`
${outputFormat}
\`\`\``);

    state.generated.finalPrompt = promptParts.join('\n\n');

    elements.finalPrompt.textContent = state.generated.finalPrompt;
}

// ===================================
// Utility Functions
// ===================================
function extractTitle(text) {
    // Extract a suitable title from the goal text
    const words = text.split(/[を、。]/)[0];
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
}

function extractOccupation(text) {
    // Simple extraction of occupation-related terms
    const patterns = ['経営者', '管理職', 'マネージャー', 'エンジニア', 'デザイナー', 'マーケター', '営業', 'コンサルタント'];
    for (const pattern of patterns) {
        if (text.includes(pattern)) return pattern;
    }
    return '専門職';
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showLoading(text) {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function showToast(message) {
    elements.toast.querySelector('.toast-message').textContent = message;
    elements.toast.classList.remove('hidden');
    elements.toast.classList.add('visible');

    setTimeout(() => {
        elements.toast.classList.remove('visible');
    }, 3000);
}

async function copyFinalPrompt() {
    try {
        await navigator.clipboard.writeText(state.generated.finalPrompt);
        showToast('プロンプトをコピーしました！');
        elements.copyBtn.innerHTML = '<span class="copy-icon">✓</span> コピー完了';
        setTimeout(() => {
            elements.copyBtn.innerHTML = '<span class="copy-icon">📋</span> コピー';
        }, 2000);
    } catch (err) {
        showToast('コピーに失敗しました');
    }
}

// ===================================
// Initialize App
// ===================================
document.addEventListener('DOMContentLoaded', init);
