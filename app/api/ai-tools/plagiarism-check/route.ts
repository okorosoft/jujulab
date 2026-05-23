import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!process.env.ZEROGPT_API_KEY) {
      return NextResponse.json(
        { error: 'ZeroGPT API key is not configured' },
        { status: 500 }
      );
    }

    // Use ZeroGPT API for plagiarism detection
    const response = await fetch('https://api.zerogpt.com/api/detect/textPlagiarism', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ApiKey': process.env.ZEROGPT_API_KEY || '',
      },
      body: JSON.stringify({
        input_text: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = {};
      }
      throw new Error(errorData.message || errorData.error?.message || `ZeroGPT API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if the API call was successful
    if (!data.success) {
      const errorMessage = data.message || data.data?.error || 'Plagiarism check failed';
      throw new Error(errorMessage);
    }

    // Extract plagiarism data from response
    const plagiarismData = data.data || {};
    const allPercentMatched = plagiarismData.allpercentmatched || 0;
    const allWordsMatched = plagiarismData.allwordsmatched || 0;
    const results = plagiarismData.result || [];
    const queryWords = plagiarismData.querywords || 0;
    const cost = plagiarismData.cost || 0;

    // Determine if content is plagiarized (threshold: >10% match)
    const isPlagiarized = allPercentMatched > 10;

    // Format detailed results
    let resultText = `Plagiarism Check Results:\n${'='.repeat(50)}\n`;
    resultText += `Overall Match Percentage: ${allPercentMatched.toFixed(2)}%\n`;
    resultText += `Words Matched: ${allWordsMatched} out of ${queryWords} words\n`;
    resultText += `${'='.repeat(50)}\n`;
    resultText += `Status: ${isPlagiarized ? '⚠️ PLAGIARIZED - Content matches found online' : '✅ ORIGINAL - No significant matches found'}\n`;
    resultText += `${'='.repeat(50)}\n\n`;

    // Add detailed matches if found
    if (results.length > 0 && results[0].percentmatched > 0) {
      resultText += `Found ${results.length} potential source(s):\n\n`;
      results.forEach((match: any, index: number) => {
        if (match.percentmatched > 0) {
          resultText += `Source ${index + 1}:\n`;
          resultText += `  Match: ${match.percentmatched.toFixed(2)}%\n`;
          resultText += `  Words Matched: ${match.wordsmatched}\n`;
          if (match.url) {
            resultText += `  URL: ${match.url}\n`;
          }
          if (match.title) {
            resultText += `  Title: ${match.title}\n`;
          }
          resultText += `\n`;
        }
      });
    } else {
      resultText += `No plagiarism detected. The content appears to be original.\n`;
    }

    return NextResponse.json({
      result: resultText,
      percentMatched: allPercentMatched,
      wordsMatched: allWordsMatched,
      queryWords,
      isPlagiarized,
      matches: results.filter((r: any) => r.percentmatched > 0),
    });
  } catch (error: any) {
    console.error('Error in plagiarism check:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check plagiarism' },
      { status: 500 }
    );
  }
}

