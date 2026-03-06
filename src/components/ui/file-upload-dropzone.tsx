'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { Upload, Loader2, X, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadDropzoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  uploading?: boolean
  uploadedFiles?: Array<{ url: string; name: string }>
  onRemoveFile?: (url: string) => void
  maxFiles?: number
  label?: string
  showPreview?: boolean
}

export function FileUploadDropzone({
  onFilesSelected,
  accept = 'image/*',
  multiple = false,
  disabled = false,
  uploading = false,
  uploadedFiles = [],
  onRemoveFile,
  maxFiles,
  label = 'Click to upload or drag and drop',
  showPreview = true,
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !uploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || uploading) return

    const files = Array.from(e.dataTransfer.files)
    
    // Filter files by accept type
    const acceptedFiles = files.filter((file) => {
      if (accept === 'image/*') {
        return file.type.startsWith('image/')
      }
      if (accept.includes('*')) {
        const baseType = accept.split('/')[0]
        return file.type.startsWith(baseType)
      }
      const acceptedTypes = accept.split(',').map((t) => t.trim())
      return acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        return file.type === type
      })
    })

    if (acceptedFiles.length > 0) {
      const filesToUpload = multiple ? acceptedFiles : [acceptedFiles[0]]
      
      // Check max files limit
      if (maxFiles && uploadedFiles.length + filesToUpload.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`)
        return
      }
      
      onFilesSelected(filesToUpload)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    // Check max files limit
    if (maxFiles && uploadedFiles.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }
    
    onFilesSelected(fileArray)
    
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled && !uploading) {
      inputRef.current?.click()
    }
  }

  return (
    <div className="space-y-2">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          (disabled || uploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : uploadedFiles.length > 0 && !multiple ? (
            <>
              <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm text-green-700 font-medium">File uploaded</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground font-medium">{label}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {accept === 'image/*' ? 'Images only' : accept.includes('.pdf') ? 'PDF, JPG, PNG' : 'All files'}
                {maxFiles && ` (max ${maxFiles})`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Preview uploaded files */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="relative group">
              {file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="h-20 w-20 object-cover rounded-lg border"
                />
              ) : (
                <div className="h-20 w-20 flex items-center justify-center bg-muted rounded-lg border">
                  <span className="text-xs text-muted-foreground text-center px-1">
                    {file.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              {onRemoveFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveFile(file.url)
                  }}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
