"use client";

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { Loader2 } from 'lucide-react';

const MonacoEditor = dynamic(
    () => import('@monaco-editor/react').then((mod) => mod.default),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full bg-[#1e1e1e] border border-white/10 rounded-xl">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
        )
    }
);

interface CodeEditorProps {
    value: string;
    onChange?: (value: string) => void;
    language: string;
    readOnly?: boolean;
    height?: string;
    placeholder?: string;
}

const languageMap: Record<string, string> = {
    'javascript': 'javascript',
    'typescript': 'typescript',
    'python': 'python',
    'java': 'java',
    'c++': 'cpp',
    'c#': 'csharp',
    'go': 'go',
    'rust': 'rust',
    'ruby': 'ruby',
    'php': 'php',
    'swift': 'swift',
    'kotlin': 'kotlin',
    'scala': 'scala',
    'r': 'r',
    'perl': 'perl',
    'lua': 'lua',
    'dart': 'dart',
    'elixir': 'elixir',
    'haskell': 'haskell',
    'shell': 'shell',
    'bash': 'shell',
    'powershell': 'powershell',
    'sql': 'sql',
    'html': 'html',
    'css': 'css',
    'xml': 'xml',
    'json': 'json',
    'yaml': 'yaml',
    'markdown': 'markdown',
    'natural language': 'plaintext',
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    language,
    readOnly = false,
    height = '400px',
    placeholder,
}) => {
    const editorRef = useRef<any>(null);

    const handleEditorMount = (editor: any) => {
        editorRef.current = editor;
    };

    const handleChange = (newValue: string | undefined) => {
        if (onChange && newValue !== undefined) {
            onChange(newValue);
        }
    };

    const getMonacoLanguage = (lang: string): string => {
        const normalized = lang.toLowerCase();
        return languageMap[normalized] || 'plaintext';
    };

    return (
        <div className="relative h-full w-full border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <MonacoEditor
                height={height}
                language={getMonacoLanguage(language)}
                value={value}
                onChange={handleChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                    readOnly,
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    folding: true,
                    bracketPairColorization: { enabled: true },
                    renderWhitespace: 'selection',
                    padding: { top: 16, bottom: 16 },
                    scrollbar: {
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                    },
                }}
            />
            {!value && placeholder && (
                <div className="absolute top-4 left-14 text-gray-500 pointer-events-none font-mono text-sm">
                    {placeholder}
                </div>
            )}
        </div>
    );
};

export default CodeEditor;
