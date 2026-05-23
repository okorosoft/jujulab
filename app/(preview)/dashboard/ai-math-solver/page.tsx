"use client";

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef, ReactElement } from 'react';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Upload, 
  X, 
  Loader2,
  Calculator,
  Send,
  Camera,
  Type,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { SkeletonPage } from "@/components/skeleton-loader";
import { trackToolUsage } from '@/lib/tool-usage-tracker';
import { saveDocument } from '@/lib/save-document';
import 'katex/dist/katex.min.css';
// @ts-ignore - react-katex doesn't have types
import { InlineMath, BlockMath } from 'react-katex';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export default function AIMathSolverPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [inputMode, setInputMode] = useState<'text' | 'photo'>('text');
  const [problemText, setProblemText] = useState('');
  const [formulaPromptText, setFormulaPromptText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showFormulaEditor, setShowFormulaEditor] = useState(false);
  const [activeFormulaTab, setActiveFormulaTab] = useState('basic');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formulaPromptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/';
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (file: File | null) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);

    if (!isValidType) {
      setError('Invalid file type. Please upload JPG, PNG, or WebP images only.');
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 10MB.');
      return;
    }

    setError(null);
    setSelectedImage(file);
    setInputMode('photo');
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSolve = async () => {
    // Combine prompt text with formula text when formula editor is open
    let textToUse = problemText.trim();
    if (showFormulaEditor && formulaPromptText.trim()) {
      // Combine main prompt with formula prompt on separate lines
      if (problemText.trim()) {
        textToUse = `${problemText.trim()}\n${formulaPromptText.trim()}`;
      } else {
        textToUse = formulaPromptText.trim();
      }
    }
    
    if (inputMode === 'text' && !textToUse.trim()) {
      setError('Please enter a math problem');
      return;
    }

    if (inputMode === 'photo' && !selectedImage) {
      setError('Please upload an image');
      return;
    }

    setIsSolving(true);
    setError(null);

    try {
      let response;
      const userMessage: Message = {
        role: 'user',
        content: inputMode === 'text' ? textToUse : '',
        imageUrl: inputMode === 'photo' && previewUrl ? previewUrl : undefined
      };

      // Add user message to conversation
      setMessages(prev => [...prev, userMessage]);

      if (inputMode === 'text') {
        // Text-based solving
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        response = await fetch('/api/math-solver/solve', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            problem: textToUse,
            conversationHistory
          }),
        });
      } else {
        // Image-based solving
        const imageBase64 = await convertImageToBase64(selectedImage!);
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        response = await fetch('/api/math-solver/solve-image', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64,
            conversationHistory
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to solve problem');
      }

      const data = await response.json();
      
      // Add assistant response to conversation
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.solution
      }]);

      // Track tool usage
      const wordCount = inputMode === 'text' 
        ? problemText.trim().split(/\s+/).filter(w => w.length > 0).length 
        : 0;
      trackToolUsage('ai-math-solver', 'AI Math Solver', wordCount);

      // Save document
      const problemInput = inputMode === 'text' ? problemText : (selectedImage?.name || 'Image Problem');
      await saveDocument({
        type: 'ai-math-solver',
        title: `Math Solution - ${new Date().toLocaleDateString()}`,
        input: problemInput,
        output: data.solution,
        wordCount: wordCount + (data.solution.split(/\s+/).filter((w: string) => w.length > 0).length || 0),
        fileName: inputMode === 'photo' ? selectedImage?.name : undefined,
        toolMetadata: { inputMode },
      });

      // Clear input
      if (inputMode === 'text') {
        setProblemText('');
      } else {
        handleImageRemove();
      }
    } catch (error) {
      console.error('Error solving problem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to solve problem. Please try again.';
      
      // Check if it's a credit error and format accordingly
      if (errorMessage.toLowerCase().includes('insufficient credits') || errorMessage.toLowerCase().includes('need')) {
        setError(`${errorMessage} Please purchase credits to continue. [Buy Credits](/dashboard/credits)`);
      } else {
        setError(errorMessage);
      }
      
      // Remove the user message if solving failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsSolving(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setInputMode('text');
    setProblemText(example);
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertSymbol = (symbol: string) => {
    // If formula editor is open, insert into formula prompt field
    if (showFormulaEditor) {
      const textarea = formulaPromptRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formulaPromptText;
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      // Check if symbol has empty parentheses or braces - place cursor inside
      let insertText = symbol;
      let cursorOffset = symbol.length;
      
      if (symbol.includes('()')) {
        // Place cursor inside parentheses
        const openParen = symbol.indexOf('()');
        insertText = symbol.replace('()', '()');
        cursorOffset = openParen + 1;
      } else if (symbol.includes('{}')) {
        // Place cursor inside braces
        const openBrace = symbol.indexOf('{}');
        insertText = symbol.replace('{}', '{}');
        cursorOffset = openBrace + 1;
      }
      
      setFormulaPromptText(before + insertText + after);
      
      // Set cursor position
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + cursorOffset;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      // Original behavior - insert into main textarea
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = problemText;
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      // Check if symbol has empty parentheses or braces - place cursor inside
      let insertText = symbol;
      let cursorOffset = symbol.length;
      
      if (symbol.includes('()')) {
        // Place cursor inside parentheses
        const openParen = symbol.indexOf('()');
        insertText = symbol.replace('()', '()');
        cursorOffset = openParen + 1;
      } else if (symbol.includes('{}')) {
        // Place cursor inside braces
        const openBrace = symbol.indexOf('{}');
        insertText = symbol.replace('{}', '{}');
        cursorOffset = openBrace + 1;
      }
      
      setProblemText(before + insertText + after);
      
      // Set cursor position
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + cursorOffset;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  const getFormulaSymbols = (tab: string): Array<{ display: string; latex: string; name: string }> => {
    switch (tab) {
      case 'basic':
        return [
          { display: '()', latex: '()', name: 'Parentheses' },
          { display: '[]', latex: '[]', name: 'Brackets' },
          { display: '{}', latex: '{}', name: 'Braces' },
          { display: '√', latex: '\\sqrt{}', name: 'Square Root' },
          { display: 'ⁿ√', latex: '\\sqrt[n]{}', name: 'Nth Root' },
          { display: 'x²', latex: 'x^{2}', name: 'Square' },
          { display: 'x³', latex: 'x^{3}', name: 'Cube' },
          { display: 'xⁿ', latex: 'x^{n}', name: 'Power' },
          { display: 'xₐ', latex: 'x_{a}', name: 'Subscript a' },
          { display: 'xₓ', latex: 'x_{x}', name: 'Subscript x' },
          { display: 'xₙ', latex: 'x_{n}', name: 'Subscript n' },
          { display: 'π', latex: '\\pi', name: 'Pi' },
          { display: 'e', latex: 'e', name: 'Euler\'s Number' },
          { display: '∞', latex: '\\infty', name: 'Infinity' },
          { display: '∑', latex: '\\sum', name: 'Summation' },
          { display: '∏', latex: '\\prod', name: 'Product' },
          { display: '∫', latex: '\\int', name: 'Integral' },
          { display: '∂', latex: '\\partial', name: 'Partial' },
          { display: '∇', latex: '\\nabla', name: 'Nabla' },
          { display: 'Δ', latex: '\\Delta', name: 'Delta' },
          { display: '±', latex: '\\pm', name: 'Plus Minus' },
          { display: '∓', latex: '\\mp', name: 'Minus Plus' },
          { display: '×', latex: '\\times', name: 'Times' },
          { display: '÷', latex: '\\div', name: 'Divide' },
        ];
      case 'arithmetic':
        return [
          { display: '+', latex: '+', name: 'Plus' },
          { display: '−', latex: '-', name: 'Minus' },
          { display: '±', latex: '\\pm', name: 'Plus Minus' },
          { display: '∓', latex: '\\mp', name: 'Minus Plus' },
          { display: '·', latex: '\\cdot', name: 'Dot' },
          { display: '*', latex: '*', name: 'Asterisk' },
          { display: '°', latex: '°', name: 'Degree' },
          { display: '×', latex: '\\times', name: 'Times' },
          { display: '÷', latex: '\\div', name: 'Divide' },
          { display: '%', latex: '%', name: 'Percent' },
          { display: '⊙', latex: '\\odot', name: 'Circled Dot' },
          { display: '⊕', latex: '\\oplus', name: 'Circled Plus' },
          { display: '∩', latex: '\\cap', name: 'Intersection' },
          { display: '∪', latex: '\\cup', name: 'Union' },
          { display: '∃', latex: '\\exists', name: 'Exists' },
          { display: '∀', latex: '\\forall', name: 'For All' },
          { display: '∅', latex: '\\emptyset', name: 'Empty Set' },
          { display: '∨', latex: '\\lor', name: 'Logical OR' },
          { display: '∧', latex: '\\land', name: 'Logical AND' },
          { display: '¬', latex: '\\neg', name: 'Negation' },
          { display: '⊥', latex: '\\bot', name: 'Bottom' },
          { display: '⊤', latex: '\\top', name: 'Top' },
        ];
      case 'relational':
        return [
          { display: '≡', latex: '\\equiv', name: 'Identical' },
          { display: '≠', latex: '\\neq', name: 'Not Equal' },
          { display: '~', latex: '\\sim', name: 'Tilde' },
          { display: '≈', latex: '\\approx', name: 'Approximately' },
          { display: '≅', latex: '\\cong', name: 'Congruent' },
          { display: '≃', latex: '\\simeq', name: 'Asymptotically Equal' },
          { display: '≇', latex: '\\ncong', name: 'Not Congruent' },
          { display: '≊', latex: '\\approxeq', name: 'Approx Equal' },
          { display: '>', latex: '>', name: 'Greater Than' },
          { display: '<', latex: '<', name: 'Less Than' },
          { display: '≮', latex: '\\nless', name: 'Not Less' },
          { display: '≯', latex: '\\ngtr', name: 'Not Greater' },
          { display: '≫', latex: '\\gg', name: 'Much Greater' },
          { display: '≪', latex: '\\ll', name: 'Much Less' },
          { display: '≥', latex: '\\geq', name: 'Greater Equal' },
          { display: '≤', latex: '\\leq', name: 'Less Equal' },
          { display: '≰', latex: '\\nleq', name: 'Not Less Equal' },
          { display: '≱', latex: '\\ngeq', name: 'Not Greater Equal' },
          { display: '∝', latex: '\\propto', name: 'Proportional' },
          { display: '∈', latex: '\\in', name: 'Element Of' },
          { display: '∉', latex: '\\notin', name: 'Not Element Of' },
          { display: '⊂', latex: '\\subset', name: 'Subset' },
          { display: '⊄', latex: '\\not\\subset', name: 'Not Subset' },
          { display: '⊃', latex: '\\supset', name: 'Superset' },
        ];
      case 'arrow':
        return [
          { display: '←', latex: '\\leftarrow', name: 'Left Arrow' },
          { display: '→', latex: '\\rightarrow', name: 'Right Arrow' },
          { display: '↔', latex: '\\leftrightarrow', name: 'Left Right Arrow' },
          { display: '↑', latex: '\\uparrow', name: 'Up Arrow' },
          { display: '↓', latex: '\\downarrow', name: 'Down Arrow' },
          { display: '↕', latex: '\\updownarrow', name: 'Up Down Arrow' },
          { display: '↗', latex: '\\nearrow', name: 'North East' },
          { display: '↘', latex: '\\searrow', name: 'South East' },
          { display: '↖', latex: '\\nwarrow', name: 'North West' },
          { display: '↙', latex: '\\swarrow', name: 'South West' },
          { display: '⇐', latex: '\\Leftarrow', name: 'Double Left' },
          { display: '⇒', latex: '\\Rightarrow', name: 'Double Right' },
          { display: '⇔', latex: '\\Leftrightarrow', name: 'Double Left Right' },
          { display: '⇑', latex: '\\Uparrow', name: 'Double Up' },
          { display: '⇓', latex: '\\Downarrow', name: 'Double Down' },
          { display: '⇕', latex: '\\Updownarrow', name: 'Double Up Down' },
          { display: '⇌', latex: '\\rightleftharpoons', name: 'Right Left Harpoon' },
          { display: '⇆', latex: '\\leftrightarrows', name: 'Left Right Arrows' },
        ];
      case 'greece':
        return [
          { display: 'α', latex: '\\alpha', name: 'Alpha' },
          { display: 'β', latex: '\\beta', name: 'Beta' },
          { display: 'γ', latex: '\\gamma', name: 'Gamma' },
          { display: 'δ', latex: '\\delta', name: 'Delta' },
          { display: 'ε', latex: '\\epsilon', name: 'Epsilon' },
          { display: 'ζ', latex: '\\zeta', name: 'Zeta' },
          { display: 'η', latex: '\\eta', name: 'Eta' },
          { display: 'θ', latex: '\\theta', name: 'Theta' },
          { display: 'ι', latex: '\\iota', name: 'Iota' },
          { display: 'κ', latex: '\\kappa', name: 'Kappa' },
          { display: 'λ', latex: '\\lambda', name: 'Lambda' },
          { display: 'μ', latex: '\\mu', name: 'Mu' },
          { display: 'ν', latex: '\\nu', name: 'Nu' },
          { display: 'ξ', latex: '\\xi', name: 'Xi' },
          { display: 'ο', latex: 'o', name: 'Omicron' },
          { display: 'π', latex: '\\pi', name: 'Pi' },
          { display: 'ρ', latex: '\\rho', name: 'Rho' },
          { display: 'σ', latex: '\\sigma', name: 'Sigma' },
          { display: 'τ', latex: '\\tau', name: 'Tau' },
          { display: 'υ', latex: '\\upsilon', name: 'Upsilon' },
          { display: 'φ', latex: '\\phi', name: 'Phi' },
          { display: 'χ', latex: '\\chi', name: 'Chi' },
          { display: 'ψ', latex: '\\psi', name: 'Psi' },
          { display: 'ω', latex: '\\omega', name: 'Omega' },
          { display: 'Α', latex: 'A', name: 'Alpha Capital' },
          { display: 'Β', latex: 'B', name: 'Beta Capital' },
          { display: 'Γ', latex: '\\Gamma', name: 'Gamma Capital' },
          { display: 'Δ', latex: '\\Delta', name: 'Delta Capital' },
          { display: 'Θ', latex: '\\Theta', name: 'Theta Capital' },
          { display: 'Λ', latex: '\\Lambda', name: 'Lambda Capital' },
          { display: 'Σ', latex: '\\Sigma', name: 'Sigma Capital' },
          { display: 'Π', latex: '\\Pi', name: 'Pi Capital' },
          { display: 'Ω', latex: '\\Omega', name: 'Omega Capital' },
        ];
      case 'subscript':
        return [
          { display: 'x²', latex: 'x^{2}', name: 'Square' },
          { display: 'x³', latex: 'x^{3}', name: 'Cube' },
          { display: 'xⁿ', latex: 'x^{n}', name: 'Power n' },
          { display: 'xₐ', latex: 'x_{a}', name: 'Subscript a' },
          { display: 'xₓ', latex: 'x_{x}', name: 'Subscript x' },
          { display: 'xₙ', latex: 'x_{n}', name: 'Subscript n' },
          { display: 'x₁', latex: 'x_{1}', name: 'Subscript 1' },
          { display: 'x₂', latex: 'x_{2}', name: 'Subscript 2' },
          { display: 'x₃', latex: 'x_{3}', name: 'Subscript 3' },
          { display: 'x̄', latex: '\\bar{x}', name: 'Bar' },
          { display: 'x̅', latex: '\\overline{x}', name: 'Overline' },
          { display: 'x̲', latex: '\\underline{x}', name: 'Underline' },
        ];
      case 'bigops':
        return [
          { display: '∑', latex: '\\sum', name: 'Summation' },
          { display: '∏', latex: '\\prod', name: 'Product' },
          { display: '∫', latex: '\\int', name: 'Integral' },
          { display: '∮', latex: '\\oint', name: 'Contour Integral' },
          { display: '∬', latex: '\\iint', name: 'Double Integral' },
          { display: '∭', latex: '\\iiint', name: 'Triple Integral' },
          { display: 'lim', latex: '\\lim', name: 'Limit' },
          { display: 'lim∞', latex: '\\lim_{x \\to \\infty}', name: 'Limit Infinity' },
          { display: 'd/dx', latex: '\\frac{d}{dx}', name: 'Derivative' },
          { display: '∂/∂x', latex: '\\frac{\\partial}{\\partial x}', name: 'Partial Derivative' },
          { display: '∇×', latex: '\\nabla \\times', name: 'Curl' },
          { display: '∇·', latex: '\\nabla \\cdot', name: 'Divergence' },
          { display: '∇', latex: '\\nabla', name: 'Nabla' },
          { display: 'Δ', latex: '\\Delta', name: 'Delta' },
          { display: '∩', latex: '\\cap', name: 'Intersection' },
          { display: '∪', latex: '\\cup', name: 'Union' },
          { display: '∧', latex: '\\land', name: 'Logical AND' },
          { display: '∨', latex: '\\lor', name: 'Logical OR' },
        ];
      case 'function':
        return [
          { display: 'sin', latex: '\\sin()', name: 'Sine' },
          { display: 'cos', latex: '\\cos()', name: 'Cosine' },
          { display: 'tan', latex: '\\tan()', name: 'Tangent' },
          { display: 'sec', latex: '\\sec()', name: 'Secant' },
          { display: 'csc', latex: '\\csc()', name: 'Cosecant' },
          { display: 'cot', latex: '\\cot()', name: 'Cotangent' },
          { display: 'sin⁻¹', latex: '\\arcsin()', name: 'Arc Sine' },
          { display: 'cos⁻¹', latex: '\\arccos()', name: 'Arc Cosine' },
          { display: 'tan⁻¹', latex: '\\arctan()', name: 'Arc Tangent' },
          { display: 'sec⁻¹', latex: '\\arcsec()', name: 'Arc Secant' },
          { display: 'csc⁻¹', latex: '\\arccsc()', name: 'Arc Cosecant' },
          { display: 'cot⁻¹', latex: '\\arccot()', name: 'Arc Cotangent' },
          { display: 'ln', latex: '\\ln()', name: 'Natural Log' },
          { display: 'log', latex: '\\log()', name: 'Logarithm' },
          { display: 'log₁₀', latex: '\\log_{10}()', name: 'Log Base 10' },
          { display: 'exp', latex: '\\exp()', name: 'Exponential' },
          { display: 'arcsin', latex: '\\arcsin()', name: 'Arc Sine' },
          { display: 'arccos', latex: '\\arccos()', name: 'Arc Cosine' },
          { display: 'arctan', latex: '\\arctan()', name: 'Arc Tangent' },
          { display: 'arcsec', latex: '\\arcsec()', name: 'Arc Secant' },
          { display: 'arccot', latex: '\\arccot()', name: 'Arc Cotangent' },
          { display: 'arccsc', latex: '\\arccsc()', name: 'Arc Cosecant' },
        ];
      case 'hyperbolic':
        return [
          { display: 'sinh', latex: '\\sinh()', name: 'Hyperbolic Sine' },
          { display: 'cosh', latex: '\\cosh()', name: 'Hyperbolic Cosine' },
          { display: 'tanh', latex: '\\tanh()', name: 'Hyperbolic Tangent' },
          { display: 'sech', latex: '\\sech()', name: 'Hyperbolic Secant' },
          { display: 'csch', latex: '\\csch()', name: 'Hyperbolic Cosecant' },
          { display: 'coth', latex: '\\coth()', name: 'Hyperbolic Cotangent' },
          { display: 'sinh⁻¹', latex: '\\arsinh()', name: 'Inverse Hyperbolic Sine' },
          { display: 'cosh⁻¹', latex: '\\arcosh()', name: 'Inverse Hyperbolic Cosine' },
          { display: 'tanh⁻¹', latex: '\\artanh()', name: 'Inverse Hyperbolic Tangent' },
          { display: 'sech⁻¹', latex: '\\arsech()', name: 'Inverse Hyperbolic Secant' },
          { display: 'csch⁻¹', latex: '\\arcsch()', name: 'Inverse Hyperbolic Cosecant' },
          { display: 'coth⁻¹', latex: '\\arcoth()', name: 'Inverse Hyperbolic Cotangent' },
          { display: 'arsinh', latex: '\\arsinh()', name: 'Area Hyperbolic Sine' },
          { display: 'arcosh', latex: '\\arcosh()', name: 'Area Hyperbolic Cosine' },
          { display: 'artanh', latex: '\\artanh()', name: 'Area Hyperbolic Tangent' },
          { display: 'arsech', latex: '\\arsech()', name: 'Area Hyperbolic Secant' },
          { display: 'arcoth', latex: '\\arcoth()', name: 'Area Hyperbolic Cotangent' },
          { display: 'arcsch', latex: '\\arcsch()', name: 'Area Hyperbolic Cosecant' },
        ];
      default:
        return [];
    }
  };

  const renderMathContent = (text: string) => {
    if (!text) return [''];
    
    const parts: (string | ReactElement)[] = [];
    let keyCounter = 0;
    
    // Check if text contains LaTeX commands or math notation (^, _, etc.)
    const hasLatexCommands = /\\[a-zA-Z]+/.test(text);
    const hasMathNotation = /[\^_\{\}]/.test(text) && /[a-zA-Z0-9]/.test(text);
    
    // Process text for rendering
    let processedText = text;
    
    // If text contains LaTeX commands or math notation and isn't already wrapped in delimiters, wrap it
    if (hasLatexCommands || hasMathNotation) {
      const hasInlineDelimiters = text.includes('\\(') && text.includes('\\)');
      const hasDisplayDelimiters = text.includes('\\[') && text.includes('\\]');
      const hasDollarDelimiters = text.match(/\$[^$]+\$/);
      
      if (!hasInlineDelimiters && !hasDisplayDelimiters && !hasDollarDelimiters) {
        // Wrap entire text in inline math delimiters for rendering
        processedText = `\\(${text}\\)`;
      }
    }
    
    // Handle display math blocks (\[ ... \] or $$ ... $$) - including multi-line
    const displayMathRegex = /\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$/g;
    const inlineMathRegex = /\\\([\s\S]*?\\\)|\$[^$\n]+?\$/g;
    
    const regex = displayMathRegex;
    
    const mathBlocks: Array<{ start: number; end: number; content: string; type: 'display' | 'inline' }> = [];
    
    // Find all display math blocks first
    let match: RegExpExecArray | null;
    regex.lastIndex = 0; // Reset regex
    while ((match = regex.exec(processedText)) !== null) {
      let content = match[0];
      // Remove delimiters - handle both \[ \] and $$ $$
      if (content.startsWith('\\[')) {
        content = content.replace(/^\\\[/, '').replace(/\\\]$/, '');
      } else if (content.startsWith('$$')) {
        content = content.replace(/^\$\$/, '').replace(/\$\$$/, '');
      }
      content = content.trim();
      
      if (content) {
        mathBlocks.push({
          start: match.index,
          end: match.index + match[0].length,
          content: content,
          type: 'display'
        });
      }
    }
    
    // Find all inline math blocks (but skip if they're inside display blocks)
    inlineMathRegex.lastIndex = 0; // Reset regex
    while ((match = inlineMathRegex.exec(processedText)) !== null) {
      const isInsideDisplay = mathBlocks.some(block => 
        match!.index >= block.start && match!.index < block.end
      );
      if (!isInsideDisplay) {
        const content = match[0]
          .replace(/^\\\(/, '')
          .replace(/\\\)$/, '')
          .replace(/^\$/, '')
          .replace(/\$$/, '')
          .trim();
        mathBlocks.push({
          start: match.index,
          end: match.index + match[0].length,
          content: content,
          type: 'inline'
        });
      }
    }
    
    // Sort by position
    mathBlocks.sort((a, b) => a.start - b.start);
    
    // Process text with math blocks
    let currentIndex = 0;
    mathBlocks.forEach((mathBlock) => {
      // Add text before math
      if (mathBlock.start > currentIndex) {
        const textBefore = processedText.substring(currentIndex, mathBlock.start);
        if (textBefore.trim()) {
          parts.push(textBefore);
        }
      }
      
      // Add math block
      try {
        if (mathBlock.type === 'display') {
          parts.push(
            <div key={`block-${keyCounter++}`} className="my-4">
              <BlockMath math={mathBlock.content} />
            </div>
          );
        } else {
          parts.push(
            <InlineMath key={`inline-${keyCounter++}`} math={mathBlock.content} />
          );
        }
      } catch (e) {
        console.error('Math rendering error:', e, mathBlock.content);
        parts.push(
          <span key={`math-error-${keyCounter++}`} className="text-red-400 font-mono text-sm">
            [Math: {mathBlock.content.substring(0, 50)}...]
          </span>
        );
      }
      currentIndex = mathBlock.end;
    });
    
    // Add remaining text
    if (currentIndex < processedText.length) {
      const remainingText = processedText.substring(currentIndex);
      if (remainingText.trim()) {
        parts.push(remainingText);
      }
    }
    
    return parts.length > 0 ? parts : [processedText];
  };

  const renderInlineMath = (text: string, startKey: number): (string | ReactElement)[] => {
    // This function is now mainly used for text that doesn't contain display math
    // Inline math is handled in renderMathContent
    return renderMathContent(text);
  };

  const formatSolution = (content: string) => {
    // Replace LaTeX blocks with placeholders first to prevent splitting them
    const mathPlaceholders: { [key: string]: string } = {};
    let placeholderCounter = 0;
    
    // Find and replace all LaTeX blocks with placeholders
    const displayMathRegex = /\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$/g;
    let processedContent = content;
    let match: RegExpExecArray | null;
    
    displayMathRegex.lastIndex = 0;
    while ((match = displayMathRegex.exec(content)) !== null) {
      const placeholder = `__MATH_BLOCK_${placeholderCounter++}__`;
      mathPlaceholders[placeholder] = match[0];
      processedContent = processedContent.replace(match[0], placeholder);
    }
    
    // Now split by sections (but math blocks are protected)
    const sections: Array<{ type: 'given' | 'step' | 'answer' | 'text'; content: string; stepNum?: string }> = [];
    
    // Check for Given/Problem section
    const givenMatch = processedContent.match(/^\*\*(Given|Problem):\*\*([\s\S]*?)(?=\*\*Step|\*\*Final|$)/i);
    if (givenMatch) {
      sections.push({
        type: 'given',
        content: givenMatch[2].trim()
      });
      processedContent = processedContent.replace(givenMatch[0], '');
    }
    
    // Check for Steps
    const stepRegex = /\*\*(Step \d+):\*\*([\s\S]*?)(?=\*\*Step|\*\*Final|$)/gi;
    let stepMatch: RegExpExecArray | null;
    stepRegex.lastIndex = 0;
    while ((stepMatch = stepRegex.exec(processedContent)) !== null) {
      sections.push({
        type: 'step',
        stepNum: stepMatch[1],
        content: stepMatch[2].trim()
      });
    }
    processedContent = processedContent.replace(stepRegex, '');
    
    // Check for Final Answer
    const answerMatch = processedContent.match(/\*\*Final Answer:\*\*([\s\S]*)/i);
    if (answerMatch) {
      sections.push({
        type: 'answer',
        content: answerMatch[1].trim()
      });
      processedContent = processedContent.replace(answerMatch[0], '');
    }
    
    // Add remaining content as text
    const remainingText = processedContent.trim();
    if (remainingText) {
      sections.push({
        type: 'text',
        content: remainingText
      });
    }
    
    // Render sections with math placeholders restored
    return sections.map((section, sIndex) => {
      let sectionContent = section.content;
      // Restore math placeholders
      Object.keys(mathPlaceholders).forEach(placeholder => {
        sectionContent = sectionContent.replace(placeholder, mathPlaceholders[placeholder]);
      });
      
      switch (section.type) {
        case 'given':
          return (
            <div key={sIndex} className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="font-bold text-blue-400 mb-2 text-lg">Given:</div>
              <div className="text-white">{renderMathContent(sectionContent)}</div>
            </div>
          );
        case 'step':
          return (
            <div key={sIndex} className="mb-4 p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="font-bold text-blue-400 mb-2 text-lg">{section.stepNum}:</div>
              <div className="text-gray-200 leading-relaxed">
                {renderMathContent(sectionContent)}
              </div>
            </div>
          );
        case 'answer':
          return (
            <div key={sIndex} className="mt-6 p-5 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-xl shadow-lg">
              <div className="font-bold text-emerald-300 mb-3 text-xl">Final Answer:</div>
              <div className="text-emerald-100 text-lg font-medium">
                {renderMathContent(sectionContent)}
              </div>
            </div>
          );
        default:
          return (
            <div key={sIndex} className="mb-3 text-gray-200 leading-relaxed">
              {renderMathContent(sectionContent)}
            </div>
          );
      }
    });
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <>
        <DashboardSidebar />
        <SkeletonPage type="ai-detector" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <DashboardSidebar />

      {/* Main Content */}
      <div className="lg:pl-64 pt-16 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              AI Math Solver
            </h1>
            <p className="text-gray-400">
              Solve math problems step-by-step with detailed explanations. Upload a photo or enter your problem.
            </p>
          </div>

          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-xl p-8 shadow-lg border border-white/10 mb-8"
          >
            {/* Mode Toggle */}
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => {
                  setInputMode('text');
                  setSelectedImage(null);
                  setPreviewUrl(null);
                  setError(null);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  inputMode === 'text'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Text Input</span>
              </button>
              <button
                onClick={() => {
                  setInputMode('photo');
                  setProblemText('');
                  setError(null);
                  fileInputRef.current?.click();
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  inputMode === 'photo'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Photo Upload</span>
              </button>
            </div>

            {/* Text Input */}
            {inputMode === 'text' && (
              <div className="space-y-4">
                <div className="relative bg-white/5 border border-white/10 rounded-lg">
                  {/* Rendered Math Overlay */}
                  {problemText && (
                    <div 
                      className="absolute inset-0 w-full h-32 rounded-lg p-4 pointer-events-none overflow-y-auto overflow-x-hidden z-0"
                      style={{ 
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word'
                      }}
                    >
                      <div className="text-white text-base leading-relaxed">
                        {renderMathContent(problemText)}
                      </div>
                    </div>
                  )}
                  
                  {/* Actual Textarea (transparent text, visible caret) */}
                  <textarea
                    ref={textareaRef}
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleSolve();
                      }
                    }}
                    placeholder="Enter your math problem here... (e.g., Solve for x: 2x + 5 = 15)"
                    className="w-full h-32 bg-transparent border-0 rounded-lg p-4 text-transparent caret-white placeholder-gray-500 focus:outline-none resize-none relative z-10"
                    disabled={isSolving}
                    style={{ 
                      color: 'transparent',
                      textShadow: '0 0 0 transparent'
                    }}
                  />
                  
                  <button
                    onClick={() => setShowFormulaEditor(!showFormulaEditor)}
                    className="absolute bottom-2 right-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors flex items-center space-x-1 z-20"
                  >
                    <Grid3x3 className="w-4 h-4" />
                    <span>Formula</span>
                  </button>
                </div>

                {/* Formula Editor */}
                {showFormulaEditor && (
                  <div className="space-y-4">
                    {/* Prompt Input Field */}
                    <div className="relative bg-white/5 border border-white/10 rounded-lg">
                      {/* Rendered Math Overlay */}
                      {formulaPromptText && (
                        <div 
                          className="absolute inset-0 w-full h-32 rounded-lg p-4 pointer-events-none overflow-y-auto overflow-x-hidden z-0"
                          style={{ 
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word'
                          }}
                        >
                          <div className="text-white text-base leading-relaxed">
                            {renderMathContent(formulaPromptText)}
                          </div>
                        </div>
                      )}
                      
                      {/* Actual Textarea (transparent text, visible caret) */}
                      <textarea
                        ref={formulaPromptRef}
                        value={formulaPromptText}
                        onChange={(e) => setFormulaPromptText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleSolve();
                          }
                        }}
                        placeholder="Write your question here... Use the formula buttons below to insert math symbols"
                        className="w-full h-32 bg-transparent border-0 rounded-lg p-4 text-transparent caret-white placeholder-gray-500 focus:outline-none resize-none relative z-10"
                        disabled={isSolving}
                        style={{ 
                          color: 'transparent',
                          textShadow: '0 0 0 transparent'
                        }}
                      />
                    </div>
                    
                    {/* Formula Editor Panel */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      {/* Tabs */}
                      <div className="flex items-center space-x-1 mb-4 overflow-x-auto pb-2">
                      <button
                        onClick={() => setActiveFormulaTab('basic')}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                          activeFormulaTab === 'basic'
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <Grid3x3 className="w-3 h-3" />
                        <span>Basic</span>
                      </button>
                      <button
                        onClick={() => setActiveFormulaTab('arithmetic')}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                          activeFormulaTab === 'arithmetic'
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Arithmetic</span>
                      </button>
                      <button
                        onClick={() => setActiveFormulaTab('relational')}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                          activeFormulaTab === 'relational'
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <span>≥</span>
                        <span>Relational</span>
                      </button>
                      <button
                        onClick={() => setActiveFormulaTab('arrow')}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                          activeFormulaTab === 'arrow'
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>Arrow</span>
                      </button>
                      <button
                        onClick={() => setActiveFormulaTab('greece')}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                          activeFormulaTab === 'greece'
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <span>α</span>
                        <span>Greece</span>
                      </button>
                      <button
                        onClick={() => setActiveFormulaTab('subscript')}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                          activeFormulaTab === 'subscript'
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <span>T<sub>i</sub></span>
                        <span>Subscript</span>
                      </button>
                      <button
                        onClick={() => setActiveFormulaTab('bigops')}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                          activeFormulaTab === 'bigops'
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <span>Σ</span>
                        <span>BigOps</span>
                      </button>
                      <button
                        onClick={() => setActiveFormulaTab('function')}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                          activeFormulaTab === 'function'
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <span>f(x)</span>
                        <span>Function</span>
                      </button>
                      <button
                        onClick={() => setActiveFormulaTab('hyperbolic')}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                          activeFormulaTab === 'hyperbolic'
                            ? 'bg-white/20 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <span>▲</span>
                        <span>Hyperbolic</span>
                      </button>
                    </div>

                    {/* Symbol Grid */}
                    <div className="grid grid-cols-6 gap-2 mb-4 max-h-64 overflow-y-auto">
                      {getFormulaSymbols(activeFormulaTab).map((symbol, index) => (
                        <button
                          key={index}
                          onClick={() => insertSymbol(symbol.latex)}
                          className="bg-white/10 hover:bg-white/20 text-white rounded-lg p-3 text-center transition-colors text-lg font-medium"
                          title={symbol.name}
                        >
                          {symbol.display}
                        </button>
                      ))}
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setProblemText('')}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                      >
                        CLR
                      </button>
                      <button
                        onClick={() => {
                          const textarea = textareaRef.current;
                          if (textarea) {
                            const pos = textarea.selectionStart - 1;
                            if (pos >= 0) {
                              textarea.setSelectionRange(pos, pos);
                              textarea.focus();
                            }
                          }
                        }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const textarea = textareaRef.current;
                          if (textarea) {
                            const pos = textarea.selectionStart + 1;
                            textarea.setSelectionRange(pos, pos);
                            textarea.focus();
                          }
                        }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => insertSymbol('π')}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-lg"
                      >
                        π
                      </button>
                      <button
                        onClick={() => {
                          const textarea = textareaRef.current;
                          if (!textarea) return;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          if (start === end && start > 0) {
                            const text = problemText;
                            setProblemText(text.substring(0, start - 1) + text.substring(start));
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start - 1, start - 1);
                            }, 0);
                          } else if (start !== end) {
                            const text = problemText;
                            setProblemText(text.substring(0, start) + text.substring(end));
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start, start);
                            }, 0);
                          }
                        }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Photo Input */}
            {inputMode === 'photo' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={isSolving}
                />
                {!selectedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all duration-300"
                  >
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-white font-medium mb-2">Click to upload a photo</p>
                    <p className="text-sm text-gray-400">Supported formats: JPG, PNG, WebP</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative w-full h-64 bg-white/5 rounded-xl overflow-hidden border border-white/10">
                      {previewUrl && (
                        <Image
                          src={previewUrl}
                          alt="Math problem"
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                    <button
                      onClick={handleImageRemove}
                      disabled={isSolving}
                      className="mt-2 p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-red-400 mb-2">{error.replace(/\[Buy Credits\]\([^)]+\)/g, '').trim()}</p>
                {(error.toLowerCase().includes('insufficient credits') || error.toLowerCase().includes('need')) && (
                  <a
                    href="/dashboard/credits"
                    className="inline-flex items-center text-sm text-yellow-400 hover:text-yellow-300 underline font-medium"
                  >
                    Buy Credits →
                  </a>
                )}
              </div>
            )}

            <button
              onClick={handleSolve}
              disabled={isSolving || (inputMode === 'text' && !problemText.trim()) || (inputMode === 'photo' && !selectedImage)}
              className="w-full mt-6 flex items-center justify-center space-x-2 px-8 py-3 bg-white hover:bg-gray-100 text-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
            >
              {isSolving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Solving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Get Answer</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Example Problems */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/10 mb-8"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Try these examples:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => handleExampleClick("A right triangle has one leg that is 6 cm long and the hypotenuse that is 10 cm long. What is the length of the other leg?")}
                className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-gray-300 hover:text-white"
              >
                Geometry: Right triangle problem
              </button>
              <button
                onClick={() => handleExampleClick("Solve for x: 2x² + 5x - 3 = 0")}
                className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-gray-300 hover:text-white"
              >
                Algebra: Quadratic equation
              </button>
              <button
                onClick={() => handleExampleClick("Find the derivative of f(x) = x³ + 2x² - 5x + 1")}
                className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-gray-300 hover:text-white"
              >
                Calculus: Derivative problem
              </button>
              <button
                onClick={() => handleExampleClick("Divide 200 into two natural numbers, one is a multiple of 17, the other is a multiple of 23. Find the two numbers.")}
                className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-gray-300 hover:text-white"
              >
                Number Theory: Division problem
              </button>
            </div>
          </motion.div>

          {/* Conversation History */}
          {messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 flex flex-col"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
              <div className="flex items-center space-x-2 p-6 pb-4 border-b border-white/10 flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
                <h2 className="text-xl font-bold text-white">Solution</h2>
              </div>

              <div 
                className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
                style={{ 
                  maxHeight: 'calc(100vh - 300px)',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
                }}
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-500/20 text-white'
                          : 'bg-white/10 text-gray-200'
                      }`}
                    >
                      {message.imageUrl && (
                        <div className="mb-3 relative w-full h-48 rounded overflow-hidden">
                          <Image
                            src={message.imageUrl}
                            alt="Problem"
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      {message.role === 'user' ? (
                        <div className="text-sm">
                          {message.content ? renderMathContent(message.content) : 'Math problem image'}
                        </div>
                      ) : (
                        <div className="max-w-none">
                          <div className="text-base leading-relaxed">
                            {formatSolution(message.content)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isSolving && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-lg p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {messages.length > 0 && (
                <div className="p-6 pt-4 border-t border-white/10 flex-shrink-0">
                  <button
                    onClick={() => {
                      setMessages([]);
                      setProblemText('');
                      handleImageRemove();
                    }}
                    className="w-full px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Clear Conversation
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

