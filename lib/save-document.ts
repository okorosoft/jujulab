// Helper function to save tool outputs to documents
// This can be called from client-side components

export interface SaveDocumentParams {
  type: string;
  title: string;
  input: string;
  output?: string;
  wordCount: number;
  fileName?: string;
  toolMetadata?: Record<string, any>;
}

export async function saveDocument(params: SaveDocumentParams): Promise<boolean> {
  try {
    const response = await fetch('/api/documents/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Failed to save document:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving document:', error);
    return false;
  }
}

