import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { DocumentStorage } from '@/lib/document-storage';

const UNDETECTABLE_API_KEY = process.env.UNDETECTABLE_API_KEY;
const UNDETECTABLE_API_URL = process.env.UNDETECTABLE_API_URL || 'https://api.undetectable.ai';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!UNDETECTABLE_API_KEY) {
      return NextResponse.json(
        { error: 'Undetectable API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, documentId } = body;

    // If we have our internal document ID, get it from our storage first
    if (documentId) {
      const document = await DocumentStorage.getDocumentById(documentId, userId);
      
      if (!document) {
        return NextResponse.json(
          { error: 'Document not found or access denied' },
          { status: 404 }
        );
      }

      // If document is already completed, return it
      if (document.status === 'completed' && document.output) {
        return NextResponse.json({
          output: document.output,
          status: 'completed'
        });
      }

      // If still processing, check with Undetectable API
      if (document.undetectableId) {
        let response;
        try {
          response = await fetch(`${UNDETECTABLE_API_URL}/document`, {
            method: 'POST',
            headers: {
              'apikey': UNDETECTABLE_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: document.undetectableId }),
          });
        } catch (fetchError: any) {
          console.error('Fetch error:', fetchError);
          if (fetchError.code === 'ENOTFOUND' || fetchError.message?.includes('getaddrinfo')) {
            return NextResponse.json(
              { 
                error: `Cannot connect to Undetectable API. Please check your UNDETECTABLE_API_URL environment variable. Current URL: ${UNDETECTABLE_API_URL}`,
                details: 'DNS resolution failed. Verify the API endpoint URL is correct.'
              },
              { status: 500 }
            );
          }
          throw fetchError;
        }

        if (response.ok) {
          const data = await response.json();
          
          // If we got the output, update our document
          if (data.output) {
            await DocumentStorage.updateDocument(documentId, userId, {
              output: data.output,
              status: 'completed'
            });
            
            return NextResponse.json({
              output: data.output,
              status: 'completed'
            });
          }
        }
      }

      // Return current status
      return NextResponse.json({
        status: document.status
      });
    }

    // Fallback to original behavior for backward compatibility
    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    let response;
    try {
      response = await fetch(`${UNDETECTABLE_API_URL}/document`, {
        method: 'POST',
        headers: {
          'apikey': UNDETECTABLE_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError);
      if (fetchError.code === 'ENOTFOUND' || fetchError.message?.includes('getaddrinfo')) {
        return NextResponse.json(
          { 
            error: `Cannot connect to Undetectable API. Please check your UNDETECTABLE_API_URL environment variable. Current URL: ${UNDETECTABLE_API_URL}`,
            details: 'DNS resolution failed. Verify the API endpoint URL is correct.'
          },
          { status: 500 }
        );
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Undetectable API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to retrieve document from Undetectable API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error retrieving document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
