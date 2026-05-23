import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getCurrentUsage, canProcessWords, getUsageLimits } from '@/lib/usage-tracking';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wordCount, feature, action = 'add' } = await req.json();

    console.log('📊 Usage tracking request:', {
      userId,
      wordCount,
      feature,
      action,
      timestamp: new Date().toISOString()
    });

    if (!wordCount || !feature || typeof wordCount !== 'number' || wordCount <= 0) {
      return NextResponse.json(
        { error: 'Invalid word count or feature' }, 
        { status: 400 }
      );
    }

    if (!['humanizer', 'detector'].includes(feature)) {
      return NextResponse.json(
        { error: 'Invalid feature. Must be "humanizer" or "detector"' }, 
        { status: 400 }
      );
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    console.log('👤 User metadata before update:', {
      planName: user.publicMetadata?.planName,
      totalWords: user.publicMetadata?.totalWords,
      humanizerWords: user.publicMetadata?.humanizerWords,
      detectorWords: user.publicMetadata?.detectorWords,
      monthlyUsage: user.publicMetadata?.monthlyUsage
    });
    
    // Check if user can process the words
    if (action === 'add') {
      const canProcess = canProcessWords(user, wordCount);
      console.log('🔍 Can process check:', canProcess);
      
      if (!canProcess.allowed) {
        console.log('❌ Usage limit exceeded:', canProcess.reason);
        return NextResponse.json({
          error: canProcess.reason,
          upgradeRequired: canProcess.upgradeRequired,
          limits: getUsageLimits(user)
        }, { status: 403 });
      }
    }

    // Get current usage
    const currentUsage = getCurrentUsage(user);
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    console.log('📈 Current usage before update:', {
      total: currentUsage.totalWords,
      humanizer: currentUsage.humanizerWords,
      detector: currentUsage.detectorWords,
      currentMonth: currentUsage.monthlyUsage[currentMonth] || 0,
      monthlyUsage: currentUsage.monthlyUsage
    });
    
    // Calculate new usage
    let newTotalWords = currentUsage.totalWords;
    let newHumanizerWords = currentUsage.humanizerWords;
    let newDetectorWords = currentUsage.detectorWords;
    let newMonthlyUsage = { ...currentUsage.monthlyUsage };

    if (action === 'add') {
      newTotalWords += wordCount;
      if (feature === 'humanizer') {
        newHumanizerWords += wordCount;
      } else {
        newDetectorWords += wordCount;
      }
      newMonthlyUsage[currentMonth] = (newMonthlyUsage[currentMonth] || 0) + wordCount;
    } else if (action === 'subtract') {
      newTotalWords = Math.max(0, newTotalWords - wordCount);
      if (feature === 'humanizer') {
        newHumanizerWords = Math.max(0, newHumanizerWords - wordCount);
      } else {
        newDetectorWords = Math.max(0, newDetectorWords - wordCount);
      }
      newMonthlyUsage[currentMonth] = Math.max(0, (newMonthlyUsage[currentMonth] || 0) - wordCount);
    }

    console.log('📊 New usage after calculation:', {
      newTotal: newTotalWords,
      newHumanizer: newHumanizerWords,
      newDetector: newDetectorWords,
      newMonthly: newMonthlyUsage[currentMonth] || 0,
      monthlyUsage: newMonthlyUsage
    });

    // Update user metadata
    const updateData = {
      publicMetadata: {
        ...user.publicMetadata,
        totalWords: newTotalWords,
        humanizerWords: newHumanizerWords,
        detectorWords: newDetectorWords,
        monthlyUsage: newMonthlyUsage,
        lastUsageUpdate: new Date().toISOString()
      }
    };

    console.log('🔄 Updating user metadata:', updateData);
    
    await clerk.users.updateUserMetadata(userId, updateData);

    // Get updated limits
    const updatedUser = await clerk.users.getUser(userId);
    const limits = getUsageLimits(updatedUser);

    console.log('✅ Usage updated successfully:', {
      newTotal: newTotalWords,
      newHumanizer: newHumanizerWords,
      newDetector: newDetectorWords,
      limits: limits,
      verification: {
        planName: updatedUser.publicMetadata?.planName,
        totalWords: updatedUser.publicMetadata?.totalWords,
        humanizerWords: updatedUser.publicMetadata?.humanizerWords,
        detectorWords: updatedUser.publicMetadata?.detectorWords
      }
    });

    return NextResponse.json({
      success: true,
      usage: {
        total: newTotalWords,
        humanizer: newHumanizerWords,
        detector: newDetectorWords,
        currentMonth: newMonthlyUsage[currentMonth] || 0
      },
      limits: {
        remaining: limits.remainingWords,
        total: limits.maxWordsPerMonth,
        isUnlimited: limits.isUnlimited,
        percentage: limits.usagePercentage
      }
    });
  } catch (error) {
    console.error('❌ Error tracking usage:', error);
    return NextResponse.json(
      { error: `Failed to track usage: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    console.log('📊 Getting usage for user:', userId);
    console.log('👤 User metadata:', {
      planName: user.publicMetadata?.planName,
      totalWords: user.publicMetadata?.totalWords,
      humanizerWords: user.publicMetadata?.humanizerWords,
      detectorWords: user.publicMetadata?.detectorWords,
      monthlyUsage: user.publicMetadata?.monthlyUsage
    });
    
    const usage = getCurrentUsage(user);
    console.log('📈 Current usage:', usage);
    
    const limits = getUsageLimits(user);
    console.log('📊 Usage limits:', limits);

    return NextResponse.json({
      success: true,
      usage: {
        total: usage.totalWords,
        humanizer: usage.humanizerWords,
        detector: usage.detectorWords,
        currentMonth: usage.monthlyUsage[new Date().toISOString().substring(0, 7)] || 0,
        lastReset: usage.lastResetDate
      },
      limits: {
        remaining: limits.remainingWords,
        total: limits.maxWordsPerMonth,
        isUnlimited: limits.isUnlimited,
        percentage: limits.usagePercentage
      }
    });
  } catch (error) {
    console.error('❌ Error getting usage:', error);
    return NextResponse.json(
      { error: `Failed to get usage: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}