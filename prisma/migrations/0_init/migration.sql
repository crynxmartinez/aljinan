-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CONTRACTOR', 'CLIENT', 'TEAM_MEMBER');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'SUPPORT_ADMIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('SUPERVISOR', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('LLC', 'CORPORATION', 'SOLE_PROPRIETOR', 'PARTNERSHIP', 'JOINT_VENTURE', 'GOVERNMENT', 'NON_PROFIT', 'OTHER');

-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('ALARM_FAULT', 'FALSE_ALARM', 'PANEL_ERROR', 'ZONE_FAULT', 'BATTERY_ISSUE', 'SPRINKLER_LEAK', 'SPRINKLER_DAMAGE', 'PIPE_LEAK', 'VALVE_ISSUE', 'PUMP_PROBLEM', 'EXTINGUISHER_REFILL', 'EXTINGUISHER_REPLACEMENT', 'EXTINGUISHER_EXPIRED', 'EXTINGUISHER_MISSING', 'SMOKE_DETECTOR_FAULT', 'HEAT_DETECTOR_FAULT', 'GAS_DETECTOR_ISSUE', 'DETECTOR_REPLACEMENT', 'EMERGENCY_LIGHT_FAULT', 'EXIT_SIGN_FAULT', 'FIRE_DOOR_ISSUE', 'EMERGENCY_EXIT_BLOCKED', 'SCHEDULED_INSPECTION', 'PREVENTIVE_MAINTENANCE', 'ANNUAL_CERTIFICATION', 'SYSTEM_TESTING', 'GENERAL_INQUIRY', 'QUOTE_REQUEST', 'NEW_INSTALLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkOrderType" AS ENUM ('SERVICE', 'INSPECTION', 'MAINTENANCE', 'INSTALLATION', 'STICKER_INSPECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('PREVENTIVE_MAINTENANCE', 'COMPLETION', 'COMPLIANCE', 'INSPECTION', 'CIVIL_DEFENSE', 'EQUIPMENT_CERTIFICATE');

-- CreateEnum
CREATE TYPE "BuildingType" AS ENUM ('OFFICE', 'RETAIL', 'WAREHOUSE', 'INDUSTRIAL', 'RESIDENTIAL', 'HOSPITAL', 'EDUCATIONAL', 'HOTEL', 'RESTAURANT', 'MALL', 'MIXED_USE', 'PARKING', 'MOSQUE', 'GOVERNMENT', 'SPORTS', 'DATA_CENTER', 'OTHER');

-- CreateEnum
CREATE TYPE "SystemStatus" AS ENUM ('WORKING', 'NEEDS_ATTENTION', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('COMPLETED', 'PARTIAL', 'PENDING');

-- CreateEnum
CREATE TYPE "TestResult" AS ENUM ('PASSED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('REQUESTED', 'QUOTED', 'SCHEDULED', 'IN_PROGRESS', 'FOR_REVIEW', 'PENDING_APPROVAL', 'COMPLETED', 'CLOSED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('FIRE_EXTINGUISHER', 'FIRE_ALARM_PANEL', 'SPRINKLER_SYSTEM', 'EMERGENCY_LIGHTING', 'EXIT_SIGN', 'FIRE_DOOR', 'SMOKE_DETECTOR', 'HEAT_DETECTOR', 'GAS_DETECTOR', 'KITCHEN_HOOD_SUPPRESSION', 'FIRE_PUMP', 'FIRE_HOSE_REEL', 'OTHER');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'NEEDS_ATTENTION');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('PASS', 'PASSED', 'FAIL', 'FAILED', 'NEEDS_REPAIR', 'ATTENTION_REQUIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAYMENT_PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'COMPLETED', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ContractSystemFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ChecklistItemStage" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FOR_REVIEW', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ChecklistItemType" AS ENUM ('SCHEDULED', 'ADHOC');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING_VERIFICATION', 'PAID');

-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('ONCE', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('COMMENT', 'STATUS_CHANGE', 'CREATED', 'UPDATED', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BranchRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_REQUEST', 'REQUEST_RECEIVED', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_COMMENT', 'WORK_ORDER_CREATED', 'WORK_ORDER_STARTED', 'WORK_ORDER_FOR_REVIEW', 'WORK_ORDER_COMPLETED', 'WORK_ORDER_APPROVED', 'WORK_ORDER_REJECTED', 'WORK_ORDER_REMINDER', 'WORK_ORDER_ASSIGNED', 'WORK_ORDER_PRICE_SET', 'SIGNATURE_REQUIRED', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'CONTRACT_SIGNED', 'CONTRACT_EXPIRING', 'PROJECT_APPROVED', 'CERTIFICATE_GENERATED', 'PAYMENT_RECEIVED', 'EQUIPMENT_EXPIRING', 'EQUIPMENT_EXPIRED', 'GENERAL');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'DECLINED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CONTRACTOR',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "emailVerificationToken" TEXT,
    "emailVerificationExpiry" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminRole" "AdminRole" NOT NULL DEFAULT 'SUPER_ADMIN',
    "canManageContractors" BOOLEAN NOT NULL DEFAULT true,
    "canManageAdmins" BOOLEAN NOT NULL DEFAULT true,
    "canImpersonateUsers" BOOLEAN NOT NULL DEFAULT true,
    "canViewAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "canManageMessages" BOOLEAN NOT NULL DEFAULT true,
    "canManagePlatform" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "companyAddress" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "businessType" "BusinessType",
    "yearEstablished" INTEGER,
    "crNumber" TEXT,
    "vatNumber" TEXT,
    "licenseNumber" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "insuranceCertUrl" TEXT,
    "insuranceExpiry" TIMESTAMP(3),
    "serviceAreas" JSONB,
    "contactPersonName" TEXT,
    "contactPersonPhone" TEXT,
    "contactPersonEmail" TEXT,
    "nextRequestNumber" INTEGER NOT NULL DEFAULT 1,
    "nextWorkOrderNumber" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "slug" TEXT,
    "displayName" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "crNumber" TEXT,
    "vatNumber" TEXT,
    "billingAddress" TEXT,
    "contacts" JSONB,
    "contactPersonName" TEXT,
    "contactPersonPhone" TEXT,
    "contactPersonEmail" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "displayName" TEXT,
    "clientNickname" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "municipality" TEXT,
    "buildingType" "BuildingType",
    "floorCount" INTEGER,
    "areaSize" DOUBLE PRECISION,
    "cdCertificateNumber" TEXT,
    "cdCertificateExpiry" TIMESTAMP(3),
    "cdCertificateUrl" TEXT,
    "contactPersonName" TEXT,
    "contactPersonPhone" TEXT,
    "contactPersonEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "RequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdById" TEXT NOT NULL,
    "createdByRole" "UserRole" NOT NULL,
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workOrderType" "WorkOrderType",
    "preferredDate" TIMESTAMP(3),
    "preferredTimeSlot" TEXT,
    "recurringType" "RecurringType" NOT NULL DEFAULT 'ONCE',
    "needsCertificate" BOOLEAN NOT NULL DEFAULT false,
    "quotedPrice" DOUBLE PRECISION,
    "quotedDate" TIMESTAMP(3),
    "quotedById" TEXT,
    "quotedAt" TIMESTAMP(3),
    "quotedNotes" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionNote" TEXT,
    "requestNumber" INTEGER,
    "quotationUrl" TEXT,
    "quotationFileName" TEXT,
    "workOrderId" TEXT,
    "occurrences" JSONB,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestPhoto" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestComment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RequestComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "requestId" TEXT,
    "workOrderId" TEXT,
    "equipmentNumber" TEXT NOT NULL,
    "equipmentType" "EquipmentType" NOT NULL,
    "customEquipmentType" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "location" TEXT,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedExpiry" TIMESTAMP(3),
    "lastInspected" TIMESTAMP(3),
    "status" "EquipmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "inspectionResult" "InspectionResult" NOT NULL DEFAULT 'PENDING',
    "isInspected" BOOLEAN NOT NULL DEFAULT false,
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "stickerApplied" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "deficiencies" TEXT,
    "certificateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "requestId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "validUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionNote" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "duration" INTEGER,
    "assignedTo" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancellationNote" TEXT,
    "rescheduleNote" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "contractId" TEXT,
    "quotationId" TEXT,
    "invoiceNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentProofUrl" TEXT,
    "paymentProofType" TEXT,
    "paymentProofFileName" TEXT,
    "paymentSubmittedAt" TIMESTAMP(3),
    "paymentSubmittedById" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "certificateFileName" TEXT,
    "certificateUrl" TEXT,
    "startSignatureUrl" TEXT,
    "startSignedById" TEXT,
    "startSignedAt" TIMESTAMP(3),
    "endSignatureUrl" TEXT,
    "endSignedById" TEXT,
    "endSignedAt" TIMESTAMP(3),
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSystem" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "ContractSystemFrequency" NOT NULL,
    "visitDates" JSONB NOT NULL,
    "dateMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "paymentDueDates" JSONB,
    "paymentAmounts" JSONB,
    "paymentDateMode" TEXT NOT NULL DEFAULT 'AUTOMATIC',
    "pricePerVisit" DOUBLE PRECISION,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractPayment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "paymentNo" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "paymentProofUrl" TEXT,
    "paymentProofType" TEXT,
    "paymentProofFileName" TEXT,
    "paymentSubmittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "contractId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ChecklistStatus" NOT NULL DEFAULT 'DRAFT',
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "stage" "ChecklistItemStage" NOT NULL DEFAULT 'SCHEDULED',
    "type" "ChecklistItemType" NOT NULL DEFAULT 'SCHEDULED',
    "workOrderType" "WorkOrderType",
    "recurringType" "RecurringType" NOT NULL DEFAULT 'ONCE',
    "parentItemId" TEXT,
    "occurrenceIndex" INTEGER,
    "workOrderNumber" INTEGER,
    "scheduledDate" TIMESTAMP(3),
    "price" DOUBLE PRECISION,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "linkedRequestId" TEXT,
    "contractSystemId" TEXT,
    "visitIndex" INTEGER,
    "paymentDueDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "problemScope" TEXT,
    "findings" TEXT,
    "actionTaken" TEXT,
    "systemStatus" "SystemStatus",
    "technicianNotes" TEXT,
    "partsReplaced" TEXT,
    "equipmentInstalled" TEXT,
    "installQuantity" TEXT,
    "completionStatus" "CompletionStatus",
    "areasInspected" TEXT,
    "systemsChecked" JSONB,
    "deficiencies" TEXT,
    "recommendations" TEXT,
    "inspectionResult" "InspectionResult",
    "systemsMaintained" TEXT,
    "maintenancePerformed" TEXT,
    "partsServiced" TEXT,
    "testResult" "TestResult",
    "nextMaintenanceDate" TIMESTAMP(3),
    "reportData" JSONB,
    "technicianSignature" TEXT,
    "technicianSignedAt" TIMESTAMP(3),
    "technicianSignedById" TEXT,
    "supervisorSignature" TEXT,
    "supervisorSignedAt" TIMESTAMP(3),
    "supervisorSignedById" TEXT,
    "clientSignature" TEXT,
    "clientSignedAt" TIMESTAMP(3),
    "clientSignedById" TEXT,
    "reportGeneratedAt" TIMESTAMP(3),
    "reportUrl" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentProofUrl" TEXT,
    "paymentProofType" TEXT,
    "paymentProofFileName" TEXT,
    "paymentSubmittedAt" TIMESTAMP(3),
    "paymentSubmittedById" TEXT,
    "paymentVerifiedAt" TIMESTAMP(3),
    "paymentVerifiedById" TEXT,
    "paymentVerifiedSignature" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "deletedReason" TEXT,
    "rescheduledAt" TIMESTAMP(3),
    "rescheduledBy" TEXT,
    "rescheduledReason" TEXT,
    "previousScheduledDate" TIMESTAMP(3),
    "rescheduledNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionPhoto" (
    "id" TEXT NOT NULL,
    "checklistItemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "photoType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "contractId" TEXT,
    "workOrderId" TEXT,
    "equipmentId" TEXT,
    "type" "CertificateType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "issuedBy" TEXT,
    "issuedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "contractId" TEXT,
    "type" "ActivityType" NOT NULL,
    "content" TEXT,
    "metadata" TEXT,
    "createdById" TEXT NOT NULL,
    "createdByRole" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "BranchRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedId" TEXT,
    "relatedType" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "showPopup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "teamRole" "TeamMemberRole" NOT NULL,
    "jobTitle" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMemberBranch" (
    "id" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMemberBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "companyName" TEXT,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "convertedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_userId_key" ON "AdminUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Contractor_userId_key" ON "Contractor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_slug_key" ON "Client"("slug");

-- CreateIndex
CREATE INDEX "Client_companyName_idx" ON "Client"("companyName");

-- CreateIndex
CREATE INDEX "Client_companyEmail_idx" ON "Client"("companyEmail");

-- CreateIndex
CREATE INDEX "Client_contractorId_companyName_idx" ON "Client"("contractorId", "companyName");

-- CreateIndex
CREATE INDEX "Client_displayName_idx" ON "Client"("displayName");

-- CreateIndex
CREATE INDEX "Branch_clientId_idx" ON "Branch"("clientId");

-- CreateIndex
CREATE INDEX "Branch_name_idx" ON "Branch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_clientId_slug_key" ON "Branch"("clientId", "slug");

-- CreateIndex
CREATE INDEX "Request_branchId_idx" ON "Request"("branchId");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");

-- CreateIndex
CREATE INDEX "Request_branchId_status_idx" ON "Request"("branchId", "status");

-- CreateIndex
CREATE INDEX "Request_title_idx" ON "Request"("title");

-- CreateIndex
CREATE INDEX "Request_assignedTo_idx" ON "Request"("assignedTo");

-- CreateIndex
CREATE INDEX "Request_workOrderType_idx" ON "Request"("workOrderType");

-- CreateIndex
CREATE INDEX "Request_branchId_createdAt_idx" ON "Request"("branchId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_certificateId_key" ON "Equipment"("certificateId");

-- CreateIndex
CREATE INDEX "Equipment_branchId_idx" ON "Equipment"("branchId");

-- CreateIndex
CREATE INDEX "Equipment_expectedExpiry_idx" ON "Equipment"("expectedExpiry");

-- CreateIndex
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");

-- CreateIndex
CREATE INDEX "Equipment_branchId_status_idx" ON "Equipment"("branchId", "status");

-- CreateIndex
CREATE INDEX "Equipment_equipmentNumber_idx" ON "Equipment"("equipmentNumber");

-- CreateIndex
CREATE INDEX "Equipment_equipmentType_idx" ON "Equipment"("equipmentType");

-- CreateIndex
CREATE INDEX "Equipment_workOrderId_idx" ON "Equipment"("workOrderId");

-- CreateIndex
CREATE INDEX "Equipment_requestId_idx" ON "Equipment"("requestId");

-- CreateIndex
CREATE INDEX "Quotation_branchId_idx" ON "Quotation"("branchId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "Quotation_branchId_createdAt_idx" ON "Quotation"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "Quotation_requestId_idx" ON "Quotation"("requestId");

-- CreateIndex
CREATE INDEX "Invoice_branchId_idx" ON "Invoice"("branchId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Invoice_contractId_idx" ON "Invoice"("contractId");

-- CreateIndex
CREATE INDEX "Invoice_branchId_createdAt_idx" ON "Invoice"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "Contract_branchId_idx" ON "Contract"("branchId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "ContractSystem_contractId_idx" ON "ContractSystem"("contractId");

-- CreateIndex
CREATE INDEX "ContractPayment_contractId_idx" ON "ContractPayment"("contractId");

-- CreateIndex
CREATE INDEX "ContractPayment_dueDate_idx" ON "ContractPayment"("dueDate");

-- CreateIndex
CREATE INDEX "ContractPayment_status_idx" ON "ContractPayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Checklist_contractId_key" ON "Checklist"("contractId");

-- CreateIndex
CREATE INDEX "Checklist_branchId_idx" ON "Checklist"("branchId");

-- CreateIndex
CREATE INDEX "Checklist_contractId_idx" ON "Checklist"("contractId");

-- CreateIndex
CREATE INDEX "ChecklistItem_stage_idx" ON "ChecklistItem"("stage");

-- CreateIndex
CREATE INDEX "ChecklistItem_scheduledDate_idx" ON "ChecklistItem"("scheduledDate");

-- CreateIndex
CREATE INDEX "ChecklistItem_deletedAt_idx" ON "ChecklistItem"("deletedAt");

-- CreateIndex
CREATE INDEX "ChecklistItem_checklistId_stage_idx" ON "ChecklistItem"("checklistId", "stage");

-- CreateIndex
CREATE INDEX "ChecklistItem_description_idx" ON "ChecklistItem"("description");

-- CreateIndex
CREATE INDEX "ChecklistItem_assignedTo_idx" ON "ChecklistItem"("assignedTo");

-- CreateIndex
CREATE INDEX "ChecklistItem_checklistId_order_idx" ON "ChecklistItem"("checklistId", "order");

-- CreateIndex
CREATE INDEX "ChecklistItem_linkedRequestId_idx" ON "ChecklistItem"("linkedRequestId");

-- CreateIndex
CREATE INDEX "ChecklistItem_workOrderNumber_idx" ON "ChecklistItem"("workOrderNumber");

-- CreateIndex
CREATE INDEX "ChecklistItem_contractSystemId_idx" ON "ChecklistItem"("contractSystemId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_equipmentId_key" ON "Certificate"("equipmentId");

-- CreateIndex
CREATE INDEX "Certificate_branchId_idx" ON "Certificate"("branchId");

-- CreateIndex
CREATE INDEX "Certificate_title_idx" ON "Certificate"("title");

-- CreateIndex
CREATE INDEX "Certificate_type_idx" ON "Certificate"("type");

-- CreateIndex
CREATE INDEX "Certificate_expiryDate_idx" ON "Certificate"("expiryDate");

-- CreateIndex
CREATE INDEX "Certificate_contractId_idx" ON "Certificate"("contractId");

-- CreateIndex
CREATE INDEX "Activity_branchId_idx" ON "Activity"("branchId");

-- CreateIndex
CREATE INDEX "Activity_contractId_idx" ON "Activity"("contractId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_showPopup_isRead_idx" ON "Notification"("userId", "showPopup", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_key" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMemberBranch_teamMemberId_branchId_key" ON "TeamMemberBranch"("teamMemberId", "branchId");

-- CreateIndex
CREATE INDEX "ContactInquiry_status_idx" ON "ContactInquiry"("status");

-- CreateIndex
CREATE INDEX "ContactInquiry_createdAt_idx" ON "ContactInquiry"("createdAt");

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contractor" ADD CONSTRAINT "Contractor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestPhoto" ADD CONSTRAINT "RequestPhoto_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestComment" ADD CONSTRAINT "RequestComment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestComment" ADD CONSTRAINT "RequestComment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSystem" ADD CONSTRAINT "ContractSystem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractPayment" ADD CONSTRAINT "ContractPayment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_contractSystemId_fkey" FOREIGN KEY ("contractSystemId") REFERENCES "ContractSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionPhoto" ADD CONSTRAINT "InspectionPhoto_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "ChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchRequest" ADD CONSTRAINT "BranchRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMemberBranch" ADD CONSTRAINT "TeamMemberBranch_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMemberBranch" ADD CONSTRAINT "TeamMemberBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

