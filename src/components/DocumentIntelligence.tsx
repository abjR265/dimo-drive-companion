import React, { useState, useRef } from 'react';
// Removed tRPC dependency - using direct MCP communication
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Wrench,
  Calendar,
  TrendingUp,
  Sparkles,
  Database
} from "lucide-react";

interface DocumentData {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: Date;
  extractedData: {
    serviceDate?: string;
    mileage?: number;
    workPerformed?: string[];
    partsReplaced?: string[];
    cost?: number;
    nextService?: string;
    confidence: number;
  };
  aiInsights: {
    maintenanceType: string;
    urgency: 'low' | 'medium' | 'high';
    recommendations: string[];
    nextServiceDate?: string;
    estimatedCost?: number;
  };
}

export const DocumentIntelligence: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock document processing - in real app, this would call OpenAI Vision API
  const processDocument = async (file: File): Promise<DocumentData> => {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockData: DocumentData = {
      id: Date.now().toString(),
      fileName: file.name,
      fileType: file.type,
      uploadDate: new Date(),
      extractedData: {
        serviceDate: '2024-01-15',
        mileage: 45000,
        workPerformed: [
          'Oil change and filter replacement',
          'Brake fluid check and top-up',
          'Tire rotation and balance',
          'Air filter replacement'
        ],
        partsReplaced: [
          'Oil filter',
          'Air filter',
          'Brake fluid'
        ],
        cost: 245.50,
        nextService: '2024-07-15',
        confidence: 0.92
      },
      aiInsights: {
        maintenanceType: 'Regular Service',
        urgency: 'low',
        recommendations: [
          'Schedule next oil change in 6 months or 5,000 miles',
          'Consider brake pad replacement at next service',
          'Monitor tire wear patterns',
          'Check battery health at next visit'
        ],
        nextServiceDate: '2024-07-15',
        estimatedCost: 180.00
      }
    };

    return mockData;
  };

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    const newDocuments: DocumentData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        try {
          const processedDoc = await processDocument(file);
          newDocuments.push(processedDoc);
        } catch (error) {
          console.error('Error processing document:', error);
        }
      }
    }

    setDocuments(prev => [...prev, ...newDocuments]);
    setIsUploading(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            <FileText className="inline h-8 w-8 mr-3 text-primary" />
            Document Intelligence
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload vehicle maintenance records, receipts, and service documents for AI-powered analysis
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Upload Vehicle Documents
                </h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop your maintenance records, receipts, or service documents here
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports: PDF, JPG, PNG (Max 10MB per file)
                </p>
              </div>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-6 py-3"
              >
                {isUploading ? 'Uploading...' : 'Choose Files'}
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              Processed Documents ({documents.length})
            </h2>
            <Badge variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>
          
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{doc.fileName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Uploaded: {doc.uploadDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getUrgencyColor(doc.aiInsights.urgency)}>
                      {doc.aiInsights.urgency.toUpperCase()} PRIORITY
                    </Badge>
                    <Badge variant="outline" className={getConfidenceColor(doc.extractedData.confidence)}>
                      {Math.round(doc.extractedData.confidence * 100)}% Confidence
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Extracted Data */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      Extracted Information
                    </h4>
                    <div className="space-y-3">
                      {doc.extractedData.serviceDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service Date:</span>
                          <span className="font-medium">{doc.extractedData.serviceDate}</span>
                        </div>
                      )}
                      {doc.extractedData.mileage && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mileage:</span>
                          <span className="font-medium">{doc.extractedData.mileage.toLocaleString()} miles</span>
                        </div>
                      )}
                      {doc.extractedData.cost && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-medium">${doc.extractedData.cost.toFixed(2)}</span>
                        </div>
                      )}
                      {doc.extractedData.nextService && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Next Service:</span>
                          <span className="font-medium">{doc.extractedData.nextService}</span>
                        </div>
                      )}
                    </div>

                    {doc.extractedData.workPerformed && doc.extractedData.workPerformed.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-foreground mb-2">Work Performed:</h5>
                        <ul className="space-y-1">
                          {doc.extractedData.workPerformed.map((work, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-center">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                              {work}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {doc.extractedData.partsReplaced && doc.extractedData.partsReplaced.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-foreground mb-2">Parts Replaced:</h5>
                        <ul className="space-y-1">
                          {doc.extractedData.partsReplaced.map((part, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-center">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                              {part}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* AI Insights */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Analysis
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Maintenance Type:</span>
                        <span className="font-medium">{doc.aiInsights.maintenanceType}</span>
                      </div>
                      {doc.aiInsights.nextServiceDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Next Service:</span>
                          <span className="font-medium">{doc.aiInsights.nextServiceDate}</span>
                        </div>
                      )}
                      {doc.aiInsights.estimatedCost && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated Cost:</span>
                          <span className="font-medium">${doc.aiInsights.estimatedCost.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <h5 className="font-medium text-foreground mb-2">Recommendations:</h5>
                      <ul className="space-y-2">
                        {doc.aiInsights.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 mt-1.5"></span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-border flex space-x-3">
                  <Button variant="outline" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Next Service
                  </Button>
                  <Button variant="outline" className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Get Cost Estimate
                  </Button>
                  <Button variant="outline" className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && !isUploading && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Documents Yet</h3>
            <p className="text-muted-foreground">
              Upload your first vehicle maintenance document to get started with AI analysis
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 