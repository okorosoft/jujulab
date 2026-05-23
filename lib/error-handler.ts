import { toast } from "sonner";

export enum ErrorType {
  // File Upload Errors
  FILE_TYPE_INVALID = 'FILE_TYPE_INVALID',
  FILE_SIZE_TOO_LARGE = 'FILE_SIZE_TOO_LARGE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  NO_FILE_SELECTED = 'NO_FILE_SELECTED',
  
  // Authentication Errors
  USER_NOT_AUTHENTICATED = 'USER_NOT_AUTHENTICATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  
  // API Errors
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_REQUEST_FAILED = 'API_REQUEST_FAILED',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  API_TIMEOUT = 'API_TIMEOUT',
  
  // Validation Errors
  INVALID_PDF_CONTENT = 'INVALID_PDF_CONTENT',
  SCHEMA_VALIDATION_FAILED = 'SCHEMA_VALIDATION_FAILED',
  
  // Rate Limiting
  USAGE_LIMIT_REACHED = 'USAGE_LIMIT_REACHED',
  
  // Browser Compatibility
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
  DRAG_DROP_NOT_SUPPORTED = 'DRAG_DROP_NOT_SUPPORTED',
  
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_LOST = 'CONNECTION_LOST',
  
  // Payment Errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SUBSCRIPTION_SYNC_FAILED = 'SUBSCRIPTION_SYNC_FAILED',
  STRIPE_ERROR = 'STRIPE_ERROR',
  
  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

interface ErrorDetails {
  message: string;
  description?: string;
  action?: string;
  duration?: number;
}

const ERROR_MESSAGES: Record<ErrorType, ErrorDetails> = {
  // File Upload Errors
  [ErrorType.FILE_TYPE_INVALID]: {
    message: "Invalid file type",
    description: "Only PDF files are supported",
    action: "Please select a PDF file and try again"
  },
  [ErrorType.FILE_SIZE_TOO_LARGE]: {
    message: "File too large",
    description: "File size exceeds your plan limit",
    action: "Upgrade your plan or choose a smaller file"
  },
  [ErrorType.FILE_UPLOAD_FAILED]: {
    message: "Upload failed",
    description: "There was an error uploading your file",
    action: "Please try uploading again"
  },
  [ErrorType.NO_FILE_SELECTED]: {
    message: "No file selected",
    description: "Please select a file to process",
    action: "Choose a file and try again"
  },
  
  // Authentication Errors
  [ErrorType.USER_NOT_AUTHENTICATED]: {
    message: "Authentication required",
    description: "Please sign in to upload files and process content",
    action: "Sign in to continue"
  },
  [ErrorType.SESSION_EXPIRED]: {
    message: "Session expired",
    description: "Your session has expired for security reasons",
    action: "Please sign in again"
  },
  [ErrorType.AUTHENTICATION_FAILED]: {
    message: "Authentication failed",
    description: "Unable to verify your identity",
    action: "Please try signing in again"
  },
  
  // API Errors
  [ErrorType.API_KEY_MISSING]: {
    message: "Service unavailable",
    description: "AI service is temporarily unavailable",
    action: "Please contact support or try again later"
  },
  [ErrorType.API_REQUEST_FAILED]: {
    message: "Processing failed",
    description: "There was an error processing your content",
    action: "Please try again"
  },
  [ErrorType.API_RATE_LIMITED]: {
    message: "Too many requests",
    description: "Please wait a moment before trying again",
    action: "Try again in a few minutes",
    duration: 5000
  },
  [ErrorType.API_TIMEOUT]: {
    message: "Request timeout",
    description: "The request took too long to process",
    action: "Please try again with a smaller PDF"
  },
  
  // Validation Errors
  [ErrorType.INVALID_PDF_CONTENT]: {
    message: "PDF processing failed",
    description: "Unable to process this PDF. It might be too large or contain unreadable text.",
    action: "Try with a smaller PDF file or ensure the text is selectable"
  },
  [ErrorType.SCHEMA_VALIDATION_FAILED]: {
    message: "Validation error",
    description: "Content doesn't meet quality standards",
    action: "Please try again"
  },
  
  // Rate Limiting
  [ErrorType.USAGE_LIMIT_REACHED]: {
    message: "Usage limit reached",
    description: "You've reached your monthly usage limit",
    action: "Upgrade your plan to continue processing"
  },
  
  // Browser Compatibility
  [ErrorType.BROWSER_NOT_SUPPORTED]: {
    message: "Browser not supported",
    description: "This feature requires a modern browser",
    action: "Please update your browser or try a different one"
  },
  [ErrorType.DRAG_DROP_NOT_SUPPORTED]: {
    message: "Drag & drop not supported",
    description: "Safari doesn't support drag and drop",
    action: "Please use the file picker instead"
  },
  
  // Network Errors
  [ErrorType.NETWORK_ERROR]: {
    message: "Network error",
    description: "Unable to connect to our servers",
    action: "Check your internet connection and try again"
  },
  [ErrorType.CONNECTION_LOST]: {
    message: "Connection lost",
    description: "Your internet connection was interrupted",
    action: "Please check your connection and try again"
  },
  
  // Generic Errors
  [ErrorType.UNKNOWN_ERROR]: {
    message: "Something went wrong",
    description: "An unexpected error occurred",
    action: "Please try again or contact support if the problem persists"
  },
  [ErrorType.SERVER_ERROR]: {
    message: "Server error",
    description: "Our servers are experiencing issues",
    action: "Please try again in a few minutes"
  },
  
  // Payment Errors
  [ErrorType.PAYMENT_FAILED]: {
    message: "Payment failed",
    description: "There was an issue processing your payment",
    action: "Please check your payment method and try again"
  },
  [ErrorType.SUBSCRIPTION_SYNC_FAILED]: {
    message: "Subscription sync error",
    description: "Your subscription status may take a few minutes to update",
    action: "Please refresh the page in a few minutes"
  },
  [ErrorType.STRIPE_ERROR]: {
    message: "Payment service error",
    description: "There was an issue with the payment service",
    action: "Please try again or contact support"
  }
};

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly userMessage: string;
  public readonly action?: string;
  public readonly originalError?: Error;

  constructor(
    type: ErrorType, 
    originalError?: Error | string,
    customMessage?: string
  ) {
    const errorDetails = ERROR_MESSAGES[type];
    const message = customMessage || errorDetails.message;
    
    super(message);
    
    this.type = type;
    this.userMessage = message;
    this.action = errorDetails.action;
    this.originalError = typeof originalError === 'string' 
      ? new Error(originalError) 
      : originalError;
    
    this.name = 'AppError';
  }
}

export const handleError = (error: Error | AppError | unknown): void => {
  console.error('Error occurred:', error);

  if (error instanceof AppError) {
    const errorDetails = ERROR_MESSAGES[error.type];
    
    toast.error(error.userMessage, {
      description: errorDetails.description,
      action: errorDetails.action ? {
        label: "Got it",
        onClick: () => {}
      } : undefined,
      duration: errorDetails.duration || 4000,
    });
    
    return;
  }

  // Handle specific error types from API responses
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      handleError(new AppError(ErrorType.NETWORK_ERROR, error));
      return;
    }
    
    if (message.includes('timeout')) {
      handleError(new AppError(ErrorType.API_TIMEOUT, error));
      return;
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      handleError(new AppError(ErrorType.AUTHENTICATION_FAILED, error));
      return;
    }
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      handleError(new AppError(ErrorType.API_RATE_LIMITED, error));
      return;
    }
    
    if (message.includes('stripe') || message.includes('payment')) {
      handleError(new AppError(ErrorType.STRIPE_ERROR, error));
      return;
    }
    
    if (message.includes('subscription') || message.includes('sync')) {
      handleError(new AppError(ErrorType.SUBSCRIPTION_SYNC_FAILED, error));
      return;
    }
  }

  // Fallback to unknown error
  handleError(new AppError(ErrorType.UNKNOWN_ERROR, error as Error));
};

export const handleSuccess = (message: string, description?: string): void => {
  toast.success(message, {
    description,
    duration: 3000,
  });
};

export const handleInfo = (message: string, description?: string): void => {
  toast.info(message, {
    description,
    duration: 3000,
  });
};

export const handleWarning = (message: string, description?: string): void => {
  toast.warning(message, {
    description,
    duration: 4000,
  });
}; 