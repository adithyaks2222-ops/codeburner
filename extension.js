const vscode = require('vscode');

// 🔊 SOUND
let soundPanel = null;

function playRoastSound() {
    if (soundPanel) soundPanel.dispose();

    soundPanel = vscode.window.createWebviewPanel(
        'sound',
        'sound',
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );

    soundPanel.webview.html = `
        <html>
        <body>
            <audio autoplay>
                <source src="https://www.myinstants.com/media/sounds/vine-boom.mp3">
            </audio>
        </body>
        </html>
    `;

    setTimeout(() => {
        if (soundPanel) {
            soundPanel.dispose();
            soundPanel = null;
        }
    }, 800);
}

// 🧠 ANALYSIS
function analyzeCode(code) {
    let issues = [];

    if ((code.match(/for/g) || []).length > 2)
        issues.push("Too many loops");

    if (code.includes("var "))
        issues.push("Using var instead of let/const");

    if (code.length < 50)
        issues.push("Code too short / incomplete");

    if (code.includes("console.log"))
        issues.push("Debug logs left in code");

    return issues;
}

// 🧬 DEV TYPE
function detectDevType(issues) {
    if (issues.includes("Too many loops")) return "Loop Lover 🔁";
    if (issues.includes("Using var instead of let/const")) return "Old School Coder 🧓";
    return "Chaotic Developer 😈";
}

// 🤖 AI (OLLAMA)
async function getAIRoast(code, issues) {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                prompt: `
Detected issues: ${issues.join(", ")}

You are a savage but intelligent senior developer.

Respond in format:
🔥 Roast:
🧠 Insight:
💡 Suggestion:
🎯 Score:

Code:
${code}
`,
                stream: false
            })
        });

        const data = await response.json();

        if (!data || !data.response) {
            return "⚠️ Invalid AI response";
        }

        return data.response;

    } catch (err) {
        console.error(err);
        return "⚠️ Ollama not running. Run: ollama run llama3";
    }
}

// 🧠 PARSE AI RESPONSE
function parseAIResponse(text) {
    return {
        roast: text.match(/🔥 Roast:(.*?)(?=🧠|$)/s)?.[1]?.trim() || "No roast",
        insight: text.match(/🧠 Insight:(.*?)(?=💡|$)/s)?.[1]?.trim() || "No insight",
        suggestion: text.match(/💡 Suggestion:(.*?)(?=🎯|$)/s)?.[1]?.trim() || "No suggestion",
        score: text.match(/🎯 Score:(.*)/s)?.[1]?.trim() || "N/A"
    };
}

// 🚀 ACTIVATE
function activate(context) {

    console.log('CodeBurner 🔥 Activated');

    const disposable = vscode.commands.registerCommand('codeburner.burnCode', async () => {

        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showInformationMessage('Open a file first 😒');
            return;
        }

        let code = editor.document.getText(editor.selection);
        if (!code.trim()) code = editor.document.getText();

        const issues = analyzeCode(code);
        const devType = detectDevType(issues);

        playRoastSound();

        const panel = vscode.window.createWebviewPanel(
            'codeBurnerAI',
            '🔥 CodeBurner AI',
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = `<h2 style="color:white;background:#1e1e1e;padding:20px;">🤖 Roasting...</h2>`;

        const aiResponse = await getAIRoast(code, issues);
        const parsed = parseAIResponse(aiResponse);

        panel.webview.html = `
        <html>
        <head>
        <style>
        body { background: #0f0f0f; color: white; font-family: 'Segoe UI'; padding: 20px; }
        h1 { color: #ff4d4d; }

        .card {
            background: #1e1e1e;
            padding: 16px;
            margin: 12px 0;
            border-radius: 12px;
            box-shadow: 0 0 15px rgba(255,0,0,0.15);
        }

        .roast { border-left: 6px solid #ff4d4d; }
        .insight { border-left: 6px solid #4da6ff; }
        .suggestion { border-left: 6px solid #4dff88; }
        .score { border-left: 6px solid gold; font-size: 18px; }
        .dev { border-left: 6px solid purple; }

        .title { font-weight: bold; margin-bottom: 8px; }
        </style>
        </head>

        <body>

        <h1>🔥 CodeBurner AI Report</h1>

        <div class="card roast"><div class="title">🔥 Roast</div>${parsed.roast}</div>
        <div class="card insight"><div class="title">🧠 Insight</div>${parsed.insight}</div>
        <div class="card suggestion"><div class="title">💡 Suggestion</div>${parsed.suggestion}</div>
        <div class="card score">🎯 Score: ${parsed.score}</div>
        <div class="card dev">🧬 Developer Type: ${devType}</div>

        </body>
        </html>
        `;
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};