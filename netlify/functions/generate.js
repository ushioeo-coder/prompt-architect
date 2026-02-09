/**
 * Netlify Function: Gemini API Proxy
 * APIキーはNetlify環境変数 GEMINI_API_KEY に設定してください
 */

exports.handler = async function (event, context) {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'API key not configured' })
        };
    }

    try {
        const { type, data } = JSON.parse(event.body);

        let prompt = '';

        switch (type) {
            case 'step1':
                prompt = generateStep1Prompt(data);
                break;
            case 'step2':
                prompt = generateStep2Prompt(data);
                break;
            case 'step3':
                prompt = generateStep3Prompt(data);
                break;
            case 'step5':
                prompt = generateStep5Prompt(data);
                break;
            default:
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Invalid type' })
                };
        }

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            return {
                statusCode: response.status,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Gemini API error', details: errorText })
            };
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ result: text })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
};

// ===================================
// Prompt Generators
// ===================================

function generateStep1Prompt(data) {
    return `あなたはプロンプトエンジニアです。以下のゴールと成果物に基づいて、プロンプトの前提条件を作成してください。

【ゴールと成果物】
${data.goal}

${data.reference ? `【参考情報・変数】\n${data.reference}\n` : ''}

以下のフォーマットで出力してください：

# 前提条件：
- タイトル：（目的に合った具体的なタイトル）
- 依頼者条件：（このプロンプトを使う人の特性を1文で）
- 前提情報：（達成に必要なリソースやスキル）
- 目的と目標：（達成したい成果や具体的な到達点）
${data.reference ? `\n# 参考情報・変数：\n${data.reference}` : ''}

各項目はシンプルにまとまった1文で作成してください。日本語で回答してください。`;
}

function generateStep2Prompt(data) {
    return `あなたはプロンプトエンジニアです。以下の読み手の情報を参考にして、仮想読者像（読み手ペルソナ）を作成してください。

【読み手の情報】
${data.reader}

【前提条件（参考）】
${data.step1 || ''}

以下のフォーマットで出力してください：

読み手ペルソナ =
- 名前：（具体的な日本人名）
- 年齢：（具体的な年齢）
- 性別：（性別）
- 職業：（具体的な職業）
- 性格・価値観：（1-2文で）
- 興味関心：（具体的に）
- 知識レベル：（専門分野と一般知識のレベル）
- 悩み・課題：（具体的な問題点）
- 情報収集の方法：（どのように情報を得るか）
- 期待すること：（この成果物に何を期待するか）

具体的で実在感のあるペルソナを作成してください。日本語で回答してください。`;
}

function generateStep3Prompt(data) {
    return `あなたはプロンプトエンジニアです。以下の書き手の情報を参考にして、AIが模倣すべき書き手ペルソナを作成してください。

【書き手の情報】
${data.writer}

【前提条件（参考）】
${data.step1 || ''}

以下のフォーマットで出力してください：

◆基本情報
- 名前：（具体的な日本人名）
- 経歴：（専門性と経験年数）
- 専門分野：（具体的な専門領域）

◆文章スタイル
- （3点ほど特徴を箇条書き）

◆文章トーン
- （2-3点ほど特徴を箇条書き）

◆表現設定
- 人称：（一人称か三人称か）
- 定型表現：（よく使う表現パターン）
- 文末表現：（です・ます調など）

設定内容に一貫性を持たせ、違和感のない人物像を作成してください。日本語で回答してください。`;
}

function generateStep5Prompt(data) {
    return `あなたはプロンプトエンジニアです。以下の情報を基に、効果的な実行指示文を5つ作成してください。

【前提条件】
${data.step1 || ''}

${data.step2 ? `【読み手ペルソナ】\n${data.step2}\n` : ''}
${data.step3 ? `【書き手ペルソナ】\n${data.step3}\n` : ''}

以下のルールに従って、5つの異なる実行指示案を作成してください：

ルール：
1. 自然な流れで2文程度でまとまった指示文とする
2. 変数は文章内で {変数名} で囲み、適切な位置に組み込む
3. 案ごとに異なる視点やアプローチを明確にする
4. 具体的で実行可能な指示にする

出力形式：
---案1---
（指示文）

---案2---
（指示文）

---案3---
（指示文）

---案4---
（指示文）

---案5---
（指示文）

日本語で回答してください。`;
}
