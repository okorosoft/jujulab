// Credit management utilities for deducting credits when tools are used

export interface CreditDeductionResult {
  success: boolean;
  remainingCredits?: number;
  error?: string;
}

/**
 * Deduct credits for a tool usage
 * @param userId - Clerk user ID
 * @param toolId - Tool ID
 * @param charactersUsed - Number of characters used
 * @returns Result with success status and remaining credits
 */
export async function deductCredits(
  userId: string,
  toolId: string,
  charactersUsed: number
): Promise<CreditDeductionResult> {
  try {
    const response = await fetch('/api/credits/deduct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toolId,
        charactersUsed,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Failed to deduct credits',
      };
    }

    const data = await response.json();
    return {
      success: true,
      remainingCredits: data.remainingCredits,
    };
  } catch (error: any) {
    console.error('Error deducting credits:', error);
    return {
      success: false,
      error: error.message || 'Failed to deduct credits',
    };
  }
}

/**
 * Check if user has enough credits for a tool
 * @param userId - Clerk user ID
 * @param toolId - Tool ID
 * @param charactersNeeded - Number of characters needed
 * @returns Object with hasEnough flag and current credits
 */
export async function checkCredits(
  userId: string,
  toolId: string,
  charactersNeeded: number
): Promise<{ hasEnough: boolean; currentCredits: number }> {
  try {
    const response = await fetch('/api/credits/status');
    if (response.ok) {
      const data = await response.json();
      const credits = data.credits || {};
      const currentCredits = credits[toolId] || 0;
      
      return {
        hasEnough: currentCredits >= charactersNeeded,
        currentCredits,
      };
    }
    
    return { hasEnough: false, currentCredits: 0 };
  } catch (error) {
    console.error('Error checking credits:', error);
    return { hasEnough: false, currentCredits: 0 };
  }
}

