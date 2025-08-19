import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Receipt, 
  Wrench, 
  BookOpen, 
  Shield,
  CheckCircle,
  AlertTriangle,
  X,
  Eye,
  Download,
  Trash2,
  Sparkles,
  Car,
  Calendar,
  MapPin,
  DollarSign
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/supabase";
import { getBestAvailableProcessor, DOCUMENT_PROCESSING_CONFIG } from "@/config/documentProcessing";
import { VehicleMatcher, DocumentMatch } from "@/services/vehicleMatcher";
import { DimoAttestationService } from "@/services/dimoAttestationService";
import { DEFAULT_PRIVACY_SETTINGS } from "@/types/privacy";

interface Document {
  id: string;
  filename: string;
  originalName: string;
  type: 'registration' | 'insurance' | 'receipt' | 'manual' | 'warranty' | 'maintenance';
  size: number;
  uploadedAt: Date;
  vin?: string; // Primary identifier
  vehicleMatch?: DocumentMatch; // Matched vehicle info
  processedData?: {
    documentType: 'car_registration' | 'insurance' | 'oil_change_receipt' | 'service_invoice' | 'unknown';
    extractedText?: string;
    vin?: string;
    vehicleInfo?: {
      vin?: string;
      plateNumber?: string;
      make?: string;
      model?: string;
      year?: number;
      color?: string;
      ownerName?: string;
      ownerAddress?: string;
    };
    serviceInfo?: {
      serviceProvider?: string;
      serviceDate?: string;
      nextServiceDate?: string;
      nextServiceMileage?: number;
      services?: Array<{
        item: string;
        cost: number;
        description?: string;
      }>;
      totalCost?: number;
      currentMileage?: number;
    };
    insuranceInfo?: {
      insuranceProvider?: string;
      policyNumber?: string;
      coverageType?: string;
      effectiveDate?: string;
      expirationDate?: string;
      premium?: number;
    };
    registrationInfo?: {
      plateNumber?: string;
      expiryDate?: string;
      renewalDate?: string;
    };
    maintenanceItems?: Array<{
      item: string;
      cost: number;
      date: string;
      nextDue?: string;
      nextDueMileage?: number;
    }>;
    alertDates?: {
      registrationExpiry?: string;
      insuranceExpiry?: string;
      nextService?: string;
      inspectionDue?: string;
      warrantyExpiry?: string;
    };
  };
  status: 'uploading' | 'processing' | 'completed' | 'error';
  dimoAttested?: boolean; // Track if document has been attested to DIMO
}

interface DocumentUploadProps {
  vehicleId?: string; // Optional - will be determined by VIN matching
  tokenId?: number; // Add tokenId for document matching
  onDocumentProcessed?: (document: Document) => void;
}

export function DocumentUpload({ vehicleId, tokenId, onDocumentProcessed }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [documentProcessor, setDocumentProcessor] = useState<any>(null);
  const [processingMethod, setProcessingMethod] = useState<string>('');
  const [vehicleMatcher] = useState(() => new VehicleMatcher());
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Initialize DIMO attestation service
  const [dimoAttestationService] = useState(() => new DimoAttestationService(
    import.meta.env.VITE_DIMO_CLIENT_ID || '',
    import.meta.env.VITE_DIMO_API_KEY || '',
    import.meta.env.VITE_DIMO_DOMAIN || ''
  ));
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Helper: resolve user's primary tokenId from stored auth
  const getPrimaryTokenIdFromAuth = (): number | null => {
    try {
      const storedAuth = localStorage.getItem('dimoAuth');
      if (!storedAuth) return null;
      const parsed = JSON.parse(storedAuth);
      const candidates = [...(parsed.sharedVehicles || []), ...(parsed.vehicles || [])];
      const first = candidates.find((v: any) => v?.tokenId || v?.id);
      const t = first?.tokenId || first?.id || parsed?.tokenId;
      if (t && !Number.isNaN(Number(t))) return Number(t);
      return null;
    } catch {
      return null;
    }
  };

  // Initialize document processor
  useEffect(() => {
    const initProcessor = async () => {
      try {
        const processor = await getBestAvailableProcessor();
        setDocumentProcessor(processor);
        setProcessingMethod(DOCUMENT_PROCESSING_CONFIG.method);
        
        // Document processing initialized
      } catch (error) {
        console.error('Failed to initialize document processor:', error);
        toast({
          title: "Processing Error",
          description: "Failed to initialize document processing. Using fallback method.",
          variant: "destructive",
        });
      }
    };

    initProcessor();
  }, []);

  // Load previously uploaded documents for the selected vehicle
  useEffect(() => {
    const loadExistingDocuments = async () => {
      try {
        // Get auth data to find user's token IDs
        const storedAuth = localStorage.getItem('dimoAuth');
        if (!storedAuth) return;
        
        const parsedAuth = JSON.parse(storedAuth);
        const walletAddress = parsedAuth.walletAddress;
        const userTokenId = parsedAuth.tokenId; // user primary token (if any)
        
        // User token ID retrieved from auth
        
        if (!walletAddress) return;
        
        // Get user from database
        const user = await db.getUserByWallet(walletAddress);
        if (!user) return;
        
        // Get all vehicles for this user to get their token IDs
        const userVehicles = await db.getVehiclesByUserId(user.id);
        const tokenIds = userVehicles.map(v => v.token_id);
        
        // Always include the user's main token ID (if available)
        if (userTokenId && !tokenIds.includes(userTokenId)) {
          tokenIds.push(userTokenId);
        }
        
        // Also check if there are any documents with the user's token ID directly
        // Loading documents for user's token IDs
        
        // Load all documents for these token IDs
        const rows = await db.getDocumentsForUserByTokenIds(tokenIds);
        // Documents loaded for user
        
        // If no documents found with the user's token IDs, try to find documents by user's main token ID
        if (rows.length === 0 && userTokenId) {
          // No documents found with user vehicles, trying direct token ID lookup
          const directRows = await db.getDocumentsByTokenId(userTokenId);
          // Documents found with direct token ID lookup
          rows.push(...directRows);
        }
        
        const allDocuments: Document[] = (rows || []).map((row: any) => ({
          id: row.id,
          filename: row.filename,
          originalName: row.original_name,
          type: row.type,
          size: row.size,
          uploadedAt: new Date(row.uploaded_at),
          processedData: row.processed_data ? JSON.parse(row.processed_data) : undefined,
          vin: undefined,
          status: 'completed',
        }));
        
        // Documents processed and loaded
        setDocuments(allDocuments);
      } catch (error) {
        console.error('Failed to load existing documents:', error);
      }
    };

    loadExistingDocuments();
  }, []); // Remove vehicleId dependency since we're loading all user documents

  const processDocument = async (file: File) => {
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStatus('Starting document processing...');
      setProcessingStartTime(Date.now());
      setEstimatedTimeRemaining(null);

      // Progress tracking function
      const updateProgress = (progress: number, status: string) => {
        setProcessingProgress(progress);
        setProcessingStatus(status);
        
        // Calculate estimated time remaining
        if (processingStartTime) {
          const elapsed = Date.now() - processingStartTime;
          const rate = progress / elapsed; // progress per millisecond
          if (rate > 0) {
            const remaining = (100 - progress) / rate;
            setEstimatedTimeRemaining(Math.round(remaining / 1000)); // Convert to seconds
          }
        }
      };

      updateProgress(5, 'Validating file...');
      await new Promise(resolve => setTimeout(resolve, 200));

      updateProgress(10, 'Initializing document processor...');
      await new Promise(resolve => setTimeout(resolve, 300));

      updateProgress(20, 'Extracting text from document...');
      let processedData;
      if (file.type === 'application/pdf') {
        if (processingMethod === 'ocr') {
          updateProgress(25, 'Using OCR.space API for PDF (30s timeout)...');
          processedData = await documentProcessor.processWithExternalOcr(file);
        } else {
          updateProgress(25, 'Processing PDF with OpenAI Vision...');
          processedData = await documentProcessor.processDocument(file);
        }
      } else if (file.type.startsWith('image/')) {
        if (processingMethod === 'ocr') {
          updateProgress(25, 'Using OCR.space API for image (30s timeout)...');
          processedData = await documentProcessor.processWithExternalOcr(file);
        } else {
          updateProgress(25, 'Processing image with OpenAI Vision...');
          processedData = await documentProcessor.processDocument(file);
        }
      } else {
        updateProgress(25, 'Processing text document...');
        processedData = await documentProcessor.processDocument(file);
      }

      updateProgress(50, 'Analyzing document with AI...');
      await new Promise(resolve => setTimeout(resolve, 500));

      updateProgress(60, 'Extracting VIN and vehicle information...');
      const vin = processedData.vin;
      
      updateProgress(70, 'Matching vehicle by VIN...');
      const vehicleMatch = await vehicleMatcher.findVehicleByVin(vin || '');

      updateProgress(80, 'Preparing to save document...');
      await new Promise(resolve => setTimeout(resolve, 300));

      updateProgress(90, 'Saving document to database...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create document object
      const id = crypto.randomUUID();
      const document: Document = {
        id,
        filename: `${id}-${file.name}`,
        originalName: file.name,
        type: determineDocumentType(file.name),
        size: file.size,
        uploadedAt: new Date(),
        status: 'completed',
        processedData,
        vin: processedData.vin,
        vehicleMatch
      };

      // Get the target vehicle ID from the vehicle match
      const targetVehicleId = vehicleMatch?.vehicleId || vehicleId;
      
      // Upload file to Supabase Storage
      const storagePath = `${targetVehicleId}/${id}-${file.name}`;
      try {
        await db.uploadFile(file, storagePath);
        // File uploaded to storage successfully
      } catch (uploadError) {
        console.error('Failed to upload file to storage:', uploadError);
      }

      // Save document metadata to database and capture created ID
      let createdDbDoc: any | null = null;
      try {
        createdDbDoc = await db.createDocument({
          vehicleId: targetVehicleId,
          tokenId: tokenId || vehicleMatch?.tokenId || getPrimaryTokenIdFromAuth() || 999999,
          type: document.type,
          filename: document.filename,
          originalName: document.originalName,
          size: document.size,
          processedData,
          storagePath
        });
        // Document saved to database successfully
      } catch (dbError) {
        console.error('Failed to save document to database:', dbError);
        toast({
          title: "Database Error",
          description: "Document processed but failed to save metadata.",
          variant: "destructive",
        });
      }

      updateProgress(100, 'Document processed successfully!');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Add document to local state using DB-created ID (fixes FK usage later)
      const documentForState: Document = {
        ...document,
        id: createdDbDoc?.id || document.id,
        uploadedAt: createdDbDoc?.uploaded_at ? new Date(createdDbDoc.uploaded_at) : document.uploadedAt,
      };
      setDocuments(prev => [...prev, documentForState]);

      // Create alerts from extracted dates
      if (processedData.alertDates) {
        try {
          // Wait a moment to ensure vehicle is fully committed to database
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get the actual vehicle ID from the database
          const targetVehicleId = document.vehicleMatch?.vehicleId || vehicleId;
          const documentIdForAlerts = createdDbDoc?.id || document.id;

          // Create alerts using the database document ID to satisfy FK constraint
          const alerts = await db.createAlertsFromDocument(documentIdForAlerts, targetVehicleId, processedData);
          // Alerts created from document
        } catch (alertError) {
          console.warn('Failed to create alerts:', alertError);
        }
      }

      // Create DIMO attestation for the processed document
      try {
        // Check if DIMO environment variables are configured
        const hasDimoConfig = import.meta.env.VITE_DIMO_CLIENT_ID && 
                             import.meta.env.VITE_DIMO_API_KEY && 
                             import.meta.env.VITE_DIMO_DOMAIN;
        
        if (!hasDimoConfig) {
          // DIMO environment variables not configured, skipping attestation
          document.dimoAttested = false;
        } else {
          updateProgress(95, 'Creating DIMO attestation...');
          
          const vehicleTokenId = tokenId || vehicleMatch?.tokenId || getPrimaryTokenIdFromAuth() || 999999;
          const attestationSuccess = await dimoAttestationService.createDocumentAttestation(
            processedData,
            vehicleTokenId,
            DEFAULT_PRIVACY_SETTINGS
          );
        
        if (attestationSuccess) {
          // Document attested successfully to DIMO
          // Update the document with attestation status
          document.dimoAttested = true;
          toast({
            title: "DIMO Attestation Created",
            description: "Document data has been attested to DIMO blockchain",
          });
        } else {
          console.warn('Failed to create DIMO attestation');
          document.dimoAttested = false;
          toast({
            title: "Attestation Warning",
            description: "Document processed but DIMO attestation failed",
            variant: "destructive",
          });
        }
        }
      } catch (attestationError) {
        console.error('Error creating DIMO attestation:', attestationError);
        toast({
          title: "Attestation Error",
          description: "Document processed but failed to create DIMO attestation",
          variant: "destructive",
        });
      }
      
      toast({
        title: "Document Processed",
        description: `Successfully processed ${file.name}`,
      });

    } catch (error) {
      console.error('Error processing document:', error);
      setProcessingStatus('Error processing document');
      toast({
        title: "Processing Error",
        description: `Failed to process ${file.name}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStatus('');
      setProcessingStartTime(null);
      setEstimatedTimeRemaining(null);
    }
  };

  const determineDocumentType = (filename: string): Document['type'] => {
    const lowerFilename = filename.toLowerCase();
    
    if (lowerFilename.includes('registration') || lowerFilename.includes('reg')) {
      return 'registration';
    }
    
    if (lowerFilename.includes('insurance') || lowerFilename.includes('policy')) {
      return 'insurance';
    }
    
    if (lowerFilename.includes('receipt') || lowerFilename.includes('service') || lowerFilename.includes('maintenance')) {
      return 'receipt';
    }
    
    if (lowerFilename.includes('manual')) {
      return 'manual';
    }
    
    if (lowerFilename.includes('warranty')) {
      return 'warranty';
    }
    
    return 'maintenance';
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    const file = files[0];
    
    // Validate file type
    const allowedTypes = DOCUMENT_PROCESSING_CONFIG.fileProcessing.allowedTypes;
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: `File type ${file.type} is not supported. Please upload PDF, JPG, PNG, TXT, DOC, or DOCX files.`,
        variant: "destructive",
      });
      return;
    }

    const maxSize = DOCUMENT_PROCESSING_CONFIG.fileProcessing.maxFileSize;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size exceeds 50MB limit. Please upload a smaller file.",
        variant: "destructive",
      });
      return;
    }

    // Start processing with progress tracking
    await processDocument(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const removeDocument = async (id: string) => {
    try {
      // Find the document to get its storage path
      const document = documents.find(d => d.id === id);
      if (!document) return;

      // Remove from Supabase Storage
      const storagePath = `${document.vehicleMatch?.vehicleId || vehicleId}/${document.filename}`;
      await db.deleteFile(storagePath);

      // Remove from database (you'll need to add a delete method to the db helper)
      // await db.deleteDocument(id);

      // Remove from local state
      setDocuments(prev => prev.filter(d => d.id !== id));
      
      toast({
        title: "Document Removed",
        description: "Document has been deleted successfully",
      });
    } catch (error) {
      console.error('Error removing document:', error);
      toast({
        title: "Error",
        description: "Failed to remove document",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'uploading': return <Upload className="h-4 w-4 animate-pulse" />;
      case 'processing': return <Sparkles className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getTypeIcon = (type: Document['type']) => {
    switch (type) {
      case 'registration': return <Car className="h-4 w-4" />;
      case 'receipt': return <Receipt className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'manual': return <BookOpen className="h-4 w-4" />;
      case 'warranty': return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Vehicle Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload car registration documents and oil change receipts for AI analysis
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => document.getElementById('file-upload')?.click()}>
                Choose Files
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Supported: PDF, JPG, PNG, TXT, DOC, DOCX (Max 50MB each)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing documents...</span>
                <span className="text-sm text-muted-foreground">
                  {documents.filter(d => d.status === 'uploading' || d.status === 'processing').length} remaining
                </span>
              </div>
              <div className="w-full bg-gray-700 dark:bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: '75%' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Processing Document...
                </h3>
                <span className="text-sm text-muted-foreground">
                  {processingProgress}%
                </span>
              </div>
              
              <div className="w-full bg-gray-700 dark:bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{processingStatus}</span>
                {estimatedTimeRemaining !== null && (
                  <span>
                    {estimatedTimeRemaining > 60 
                      ? `${Math.floor(estimatedTimeRemaining / 60)}m ${estimatedTimeRemaining % 60}s remaining`
                      : `${estimatedTimeRemaining}s remaining`
                    }
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    {getTypeIcon(doc.type)}
                    <div>
                      <p className="font-medium">{doc.originalName}</p>
                      <p className="text-sm text-muted-foreground">
                        {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.uploadedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {doc.status === 'completed' && doc.processedData && (
                      <Badge variant="secondary" className="text-xs">
                        {doc.processedData.documentType === 'car_registration' ? 'Registration' : 
                         doc.processedData.documentType === 'oil_change_receipt' ? 'Oil Change' : 'Document'}
                      </Badge>
                    )}
                    {doc.dimoAttested && (
                      <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        DIMO Attested
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Results */}
      {documents.filter(d => d.status === 'completed' && d.processedData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents
                .filter(d => d.status === 'completed' && d.processedData)
                .map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{doc.originalName}</h4>
                      <Badge variant="outline">
                        {doc.processedData?.documentType === 'car_registration' ? 'Car Registration' :
                         doc.processedData?.documentType === 'oil_change_receipt' ? 'Oil Change Receipt' :
                         'Document'}
                      </Badge>
                    </div>
                    
                    {doc.processedData && (
                      <div className="space-y-3">

                        {/* Vehicle Information */}
                        {(doc.processedData.vehicleInfo || doc.processedData.vin) && (
                          <div className="space-y-2">
                            <h5 className="font-medium flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              Vehicle Information
                            </h5>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {(doc.processedData.vin || doc.processedData.vehicleInfo?.vin) && (
                                <div>
                                  <span className="font-medium">VIN: </span>
                                  <span className="font-mono">{doc.processedData.vin || doc.processedData.vehicleInfo?.vin}</span>
                                </div>
                              )}
                              {(doc.processedData.vehicleInfo?.plateNumber || doc.processedData.registrationInfo?.plateNumber) && (
                                <div>
                                  <span className="font-medium">Plate: </span>
                                  <span className="font-mono">{doc.processedData.vehicleInfo?.plateNumber || doc.processedData.registrationInfo?.plateNumber}</span>
                                </div>
                              )}
                              {doc.processedData.vehicleInfo?.make && (
                                <div>
                                  <span className="font-medium">Make: </span>
                                  <span>{doc.processedData.vehicleInfo.make}</span>
                                </div>
                              )}
                              {doc.processedData.vehicleInfo?.model && (
                                <div>
                                  <span className="font-medium">Model: </span>
                                  <span>{doc.processedData.vehicleInfo.model}</span>
                                </div>
                              )}
                              {doc.processedData.vehicleInfo?.year && (
                                <div>
                                  <span className="font-medium">Year: </span>
                                  <span>{doc.processedData.vehicleInfo.year}</span>
                                </div>
                              )}
                              {doc.processedData.vehicleInfo?.color && (
                                <div>
                                  <span className="font-medium">Color: </span>
                                  <span>{doc.processedData.vehicleInfo.color}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Registration Information */}
                        {doc.processedData.registrationInfo && (
                          <div className="space-y-2">
                            <h5 className="font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Registration Information
                            </h5>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {doc.processedData.registrationInfo.plateNumber && (
                                <div>
                                  <span className="font-medium">Plate Number: </span>
                                  <span className="font-mono">{doc.processedData.registrationInfo.plateNumber}</span>
                                </div>
                              )}
                              {doc.processedData.registrationInfo.expiryDate && (
                                <div>
                                  <span className="font-medium">Expiry Date: </span>
                                  <span className="text-red-600 font-medium">{doc.processedData.registrationInfo.expiryDate}</span>
                                </div>
                              )}
                              {doc.processedData.registrationInfo.renewalDate && (
                                <div>
                                  <span className="font-medium">Renewal Date: </span>
                                  <span>{doc.processedData.registrationInfo.renewalDate}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Service Information */}
                        {doc.processedData.serviceInfo && (
                          <div className="space-y-2">
                            <h5 className="font-medium flex items-center gap-2">
                              <Wrench className="h-4 w-4" />
                              Service Information
                            </h5>
                            <div className="space-y-2 text-sm">
                              {doc.processedData.serviceInfo.serviceProvider && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{doc.processedData.serviceInfo.serviceProvider}</span>
                                </div>
                              )}
                              {doc.processedData.serviceInfo.nextServiceDate && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Next Service: {doc.processedData.serviceInfo.nextServiceDate}</span>
                                </div>
                              )}
                              {doc.processedData.serviceInfo.nextServiceMileage && (
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4" />
                                  <span>Next Service Mileage: {doc.processedData.serviceInfo.nextServiceMileage.toLocaleString()}</span>
                                </div>
                              )}
                              {doc.processedData.serviceInfo.totalCost && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  <span className="font-bold text-green-600">
                                    Total Cost: ${doc.processedData.serviceInfo.totalCost}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Alert Dates */}
                        {doc.processedData.alertDates && (
                          <div className="space-y-2">
                            <h5 className="font-medium flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              Important Dates
                            </h5>
                            <div className="space-y-2 text-sm">
                              {doc.processedData.alertDates.registrationExpiry && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-red-500" />
                                  <span className="text-red-600 font-medium">
                                    Registration Expires: {doc.processedData.alertDates.registrationExpiry}
                                  </span>
                                </div>
                              )}
                              {doc.processedData.alertDates.insuranceExpiry && (
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-blue-500" />
                                  <span className="text-blue-600 font-medium">
                                    Insurance Expires: {doc.processedData.alertDates.insuranceExpiry}
                                  </span>
                                </div>
                              )}
                              {doc.processedData.alertDates.nextService && (
                                <div className="flex items-center gap-2">
                                  <Wrench className="h-4 w-4 text-orange-500" />
                                  <span className="text-orange-600 font-medium">
                                    Next Service: {doc.processedData.alertDates.nextService}
                                  </span>
                                </div>
                              )}
                              {doc.processedData.alertDates.inspectionDue && (
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4 text-purple-500" />
                                  <span className="text-purple-600 font-medium">
                                    Inspection Due: {doc.processedData.alertDates.inspectionDue}
                                  </span>
                                </div>
                              )}
                              {doc.processedData.alertDates.warrantyExpiry && (
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-green-500" />
                                  <span className="text-green-600 font-medium">
                                    Warranty Expires: {doc.processedData.alertDates.warrantyExpiry}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 