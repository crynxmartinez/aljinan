import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all checklist items for a branch (for Kanban view)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId } = await params
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const stage = searchParams.get('stage')

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build the where clause
    // When projectId is provided, show items for that project OR items with no project (standalone requests)
    const whereClause: Record<string, unknown> = {
      checklist: {
        branchId,
      }
    }

    if (projectId) {
      // Include items from the selected project OR standalone items (null projectId)
      whereClause.checklist = {
        branchId,
        OR: [
          { projectId: projectId },
          { projectId: null }
        ]
      }
    }

    if (stage) {
      whereClause.stage = stage
    }

    const items = await prisma.checklistItem.findMany({
      where: whereClause,
      include: {
        checklist: {
          include: {
            project: {
              select: {
                title: true
              }
            }
          }
        },
        photos: true
      },
      orderBy: [
        { stage: 'asc' },
        { scheduledDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Transform to flat structure for Kanban
    const transformedItems = items.map(item => ({
      id: item.id,
      description: item.description,
      notes: item.notes,
      stage: item.stage,
      type: item.type,
      workOrderType: item.workOrderType,
      scheduledDate: item.scheduledDate?.toISOString() || null,
      price: item.price,
      isCompleted: item.isCompleted,
      checklistId: item.checklistId,
      checklistTitle: item.checklist.title,
      projectTitle: item.checklist.project?.title || null,
      linkedRequestId: item.linkedRequestId,
      // Inspection fields
      inspectionDate: item.inspectionDate?.toISOString() || null,
      systemsChecked: item.systemsChecked,
      findings: item.findings,
      deficiencies: item.deficiencies,
      recommendations: item.recommendations,
      technicianSignature: item.technicianSignature,
      technicianSignedAt: item.technicianSignedAt?.toISOString() || null,
      supervisorSignature: item.supervisorSignature,
      supervisorSignedAt: item.supervisorSignedAt?.toISOString() || null,
      reportGeneratedAt: item.reportGeneratedAt?.toISOString() || null,
      reportUrl: item.reportUrl,
      photos: item.photos,
      // Payment fields
      paymentStatus: item.paymentStatus,
      paymentProofUrl: item.paymentProofUrl,
      paymentProofType: item.paymentProofType,
      paymentProofFileName: item.paymentProofFileName,
      paymentSubmittedAt: item.paymentSubmittedAt?.toISOString() || null,
    }))

    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error('Error fetching checklist items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklist items' },
      { status: 500 }
    )
  }
}

// PATCH - Handle payment submission and verification
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId } = await params
    const body = await request.json()
    const { 
      action, 
      workOrderIds, 
      workOrderId, // Single work order for inspection updates
      paymentProofUrl, 
      paymentProofType, 
      paymentProofFileName, 
      signature,
      // Inspection fields
      inspectionDate,
      systemsChecked,
      findings,
      deficiencies,
      recommendations,
      // Photo management
      photoUrls,
      removePhotoIds
    } = body

    const hasAccess = await verifyBranchAccess(branchId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Handle inspection update for single work order
    if (action === 'update_inspection') {
      if (!workOrderId) {
        return NextResponse.json({ error: 'Work order ID required' }, { status: 400 })
      }

      // Verify work order belongs to this branch
      const workOrder = await prisma.checklistItem.findFirst({
        where: {
          id: workOrderId,
          checklist: { branchId }
        }
      })

      if (!workOrder) {
        return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
      }

      // Build update data
      const updateData: Record<string, unknown> = {}
      if (inspectionDate !== undefined) updateData.inspectionDate = inspectionDate ? new Date(inspectionDate) : null
      if (systemsChecked !== undefined) updateData.systemsChecked = systemsChecked
      if (findings !== undefined) updateData.findings = findings
      if (deficiencies !== undefined) updateData.deficiencies = deficiencies
      if (recommendations !== undefined) updateData.recommendations = recommendations

      // Update work order
      const updatedWorkOrder = await prisma.checklistItem.update({
        where: { id: workOrderId },
        data: updateData,
        include: { photos: true }
      })

      // Add new photos if provided
      if (photoUrls && photoUrls.length > 0) {
        await prisma.inspectionPhoto.createMany({
          data: photoUrls.map((photo: { url: string; caption?: string; photoType?: string }) => ({
            checklistItemId: workOrderId,
            url: photo.url,
            caption: photo.caption || null,
            photoType: photo.photoType || null
          }))
        })
      }

      // Remove photos if specified
      if (removePhotoIds && removePhotoIds.length > 0) {
        await prisma.inspectionPhoto.deleteMany({
          where: { id: { in: removePhotoIds } }
        })
      }

      // Fetch updated work order with photos
      const finalWorkOrder = await prisma.checklistItem.findUnique({
        where: { id: workOrderId },
        include: { photos: true }
      })

      return NextResponse.json(finalWorkOrder)
    }

    // Handle technician signature
    if (action === 'technician_sign') {
      if (!workOrderId || !signature) {
        return NextResponse.json({ error: 'Work order ID and signature required' }, { status: 400 })
      }

      const updatedWorkOrder = await prisma.checklistItem.update({
        where: { id: workOrderId },
        data: {
          technicianSignature: signature,
          technicianSignedAt: new Date(),
          technicianSignedById: session.user.id
        }
      })

      return NextResponse.json(updatedWorkOrder)
    }

    // Handle supervisor signature
    if (action === 'supervisor_sign') {
      if (!workOrderId || !signature) {
        return NextResponse.json({ error: 'Work order ID and signature required' }, { status: 400 })
      }

      // Only supervisors or contractors can sign as supervisor
      if (session.user.role !== 'CONTRACTOR') {
        // Check if team member is a supervisor
        const teamMember = await prisma.teamMember.findUnique({
          where: { userId: session.user.id }
        })
        if (!teamMember || teamMember.teamRole !== 'SUPERVISOR') {
          return NextResponse.json({ error: 'Only supervisors can sign' }, { status: 403 })
        }
      }

      // Get current work order to check if client already signed
      const currentWorkOrder = await prisma.checklistItem.findUnique({
        where: { id: workOrderId },
        include: {
          checklist: {
            include: {
              project: true
            }
          }
        }
      })

      if (!currentWorkOrder) {
        return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
      }

      const updatedWorkOrder = await prisma.checklistItem.update({
        where: { id: workOrderId },
        data: {
          supervisorSignature: signature,
          supervisorSignedAt: new Date(),
          supervisorSignedById: session.user.id
        }
      })

      // Check if client already signed - auto-complete if both parties signed
      if (currentWorkOrder.clientSignature) {
        // Both parties signed - auto-move to COMPLETED
        await prisma.checklistItem.update({
          where: { id: workOrderId },
          data: { stage: 'COMPLETED' }
        })

        // Check if certificate is needed and auto-generate
        let needsCertificate = false
        if (currentWorkOrder.linkedRequestId) {
          const linkedRequest = await prisma.request.findUnique({
            where: { id: currentWorkOrder.linkedRequestId }
          })
          needsCertificate = linkedRequest?.needsCertificate || false
        }

        if (currentWorkOrder.workOrderType === 'INSPECTION' || currentWorkOrder.workOrderType === 'MAINTENANCE') {
          needsCertificate = true
        }

        if (needsCertificate && currentWorkOrder.checklist?.project?.branchId) {
          const existingCert = await prisma.certificate.findFirst({
            where: { workOrderId: workOrderId }
          })

          if (!existingCert) {
            let certType: 'PREVENTIVE_MAINTENANCE' | 'COMPLETION' | 'COMPLIANCE' | 'INSPECTION' | 'CIVIL_DEFENSE' = 'COMPLETION'
            if (currentWorkOrder.workOrderType === 'INSPECTION') certType = 'INSPECTION'
            else if (currentWorkOrder.workOrderType === 'MAINTENANCE') certType = 'PREVENTIVE_MAINTENANCE'

            let expiryDate: Date | null = new Date()
            if (currentWorkOrder.recurringType === 'MONTHLY') {
              expiryDate.setMonth(expiryDate.getMonth() + 1)
            } else if (currentWorkOrder.recurringType === 'QUARTERLY') {
              expiryDate.setMonth(expiryDate.getMonth() + 3)
            } else {
              expiryDate.setFullYear(expiryDate.getFullYear() + 1)
            }

            await prisma.certificate.create({
              data: {
                branchId: currentWorkOrder.checklist.project.branchId,
                projectId: currentWorkOrder.checklist.projectId,
                workOrderId: workOrderId,
                type: certType,
                title: `${certType.charAt(0) + certType.slice(1).toLowerCase().replace('_', ' ')} Certificate - ${currentWorkOrder.description}`,
                description: currentWorkOrder.findings || currentWorkOrder.recommendations || `Certificate for completed work: ${currentWorkOrder.description}`,
                fileUrl: '',
                issueDate: new Date(),
                expiryDate: expiryDate,
                issuedBy: 'System (Auto-generated)',
                issuedById: session.user.id,
              }
            })

            if (currentWorkOrder.checklist?.projectId) {
              await prisma.activity.create({
                data: {
                  projectId: currentWorkOrder.checklist.projectId,
                  type: 'UPDATED',
                  content: `Certificate auto-generated for work order "${currentWorkOrder.description}" after supervisor signature`,
                  createdById: session.user.id,
                  createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
                }
              })
            }
          }
        }

        if (currentWorkOrder.checklist?.projectId) {
          await prisma.activity.create({
            data: {
              projectId: currentWorkOrder.checklist.projectId,
              type: 'STATUS_CHANGE',
              content: `Work order "${currentWorkOrder.description}" auto-completed after both parties signed`,
              createdById: session.user.id,
              createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
            }
          })
        }
      }

      return NextResponse.json(updatedWorkOrder)
    }

    // Handle client signature (accepting completed work)
    if (action === 'client_sign') {
      if (!workOrderId || !signature) {
        return NextResponse.json({ error: 'Work order ID and signature required' }, { status: 400 })
      }

      // Only clients can sign as client
      if (session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Only clients can sign' }, { status: 403 })
      }

      // Get current work order to check if supervisor already signed
      const currentWorkOrder = await prisma.checklistItem.findUnique({
        where: { id: workOrderId },
        include: {
          checklist: {
            include: {
              project: true
            }
          }
        }
      })

      if (!currentWorkOrder) {
        return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
      }

      // Update with client signature
      const updatedWorkOrder = await prisma.checklistItem.update({
        where: { id: workOrderId },
        data: {
          clientSignature: signature,
          clientSignedAt: new Date(),
          clientSignedById: session.user.id
        }
      })

      // Check if both client and supervisor/technician have signed - auto-complete
      const hasTechnicianOrSupervisorSignature = currentWorkOrder.technicianSignature || currentWorkOrder.supervisorSignature
      
      if (hasTechnicianOrSupervisorSignature) {
        // Both parties signed - auto-move to COMPLETED
        await prisma.checklistItem.update({
          where: { id: workOrderId },
          data: { stage: 'COMPLETED' }
        })

        // Check if certificate is needed and auto-generate
        let needsCertificate = false
        if (currentWorkOrder.linkedRequestId) {
          const linkedRequest = await prisma.request.findUnique({
            where: { id: currentWorkOrder.linkedRequestId }
          })
          needsCertificate = linkedRequest?.needsCertificate || false
        }

        // Also check work order type
        if (currentWorkOrder.workOrderType === 'INSPECTION' || currentWorkOrder.workOrderType === 'MAINTENANCE') {
          needsCertificate = true
        }

        if (needsCertificate && currentWorkOrder.checklist?.project?.branchId) {
          // Check if certificate already exists
          const existingCert = await prisma.certificate.findFirst({
            where: { workOrderId: workOrderId }
          })

          if (!existingCert) {
            // Determine certificate type
            let certType: 'PREVENTIVE_MAINTENANCE' | 'COMPLETION' | 'COMPLIANCE' | 'INSPECTION' | 'CIVIL_DEFENSE' = 'COMPLETION'
            if (currentWorkOrder.workOrderType === 'INSPECTION') certType = 'INSPECTION'
            else if (currentWorkOrder.workOrderType === 'MAINTENANCE') certType = 'PREVENTIVE_MAINTENANCE'

            // Calculate expiry date
            let expiryDate: Date | null = new Date()
            if (currentWorkOrder.recurringType === 'MONTHLY') {
              expiryDate.setMonth(expiryDate.getMonth() + 1)
            } else if (currentWorkOrder.recurringType === 'QUARTERLY') {
              expiryDate.setMonth(expiryDate.getMonth() + 3)
            } else {
              expiryDate.setFullYear(expiryDate.getFullYear() + 1)
            }

            // Create certificate
            await prisma.certificate.create({
              data: {
                branchId: currentWorkOrder.checklist.project.branchId,
                projectId: currentWorkOrder.checklist.projectId,
                workOrderId: workOrderId,
                type: certType,
                title: `${certType.charAt(0) + certType.slice(1).toLowerCase().replace('_', ' ')} Certificate - ${currentWorkOrder.description}`,
                description: currentWorkOrder.findings || currentWorkOrder.recommendations || `Certificate for completed work: ${currentWorkOrder.description}`,
                fileUrl: '',
                issueDate: new Date(),
                expiryDate: expiryDate,
                issuedBy: 'System (Auto-generated)',
                issuedById: session.user.id,
              }
            })

            // Create activity
            if (currentWorkOrder.checklist?.projectId) {
              await prisma.activity.create({
                data: {
                  projectId: currentWorkOrder.checklist.projectId,
                  type: 'UPDATED',
                  content: `Certificate auto-generated for work order "${currentWorkOrder.description}" after client signature`,
                  createdById: session.user.id,
                  createdByRole: 'CLIENT',
                }
              })
            }
          }
        }

        // Create activity for completion
        if (currentWorkOrder.checklist?.projectId) {
          await prisma.activity.create({
            data: {
              projectId: currentWorkOrder.checklist.projectId,
              type: 'STATUS_CHANGE',
              content: `Work order "${currentWorkOrder.description}" auto-completed after both parties signed`,
              createdById: session.user.id,
              createdByRole: 'CLIENT',
            }
          })
        }
      }

      return NextResponse.json(updatedWorkOrder)
    }

    // For bulk payment actions, require workOrderIds array
    if (!workOrderIds || !Array.isArray(workOrderIds) || workOrderIds.length === 0) {
      return NextResponse.json({ error: 'Work order IDs required' }, { status: 400 })
    }

    // Verify all work orders belong to this branch
    const workOrders = await prisma.checklistItem.findMany({
      where: {
        id: { in: workOrderIds },
        checklist: { branchId }
      },
      include: {
        checklist: {
          include: {
            project: {
              include: {
                contracts: true
              }
            }
          }
        }
      }
    })

    if (workOrders.length !== workOrderIds.length) {
      return NextResponse.json({ error: 'Invalid work order IDs' }, { status: 400 })
    }

    if (action === 'submit_payment') {
      // Client submitting payment proof
      if (session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Only clients can submit payment proof' }, { status: 403 })
      }

      if (!paymentProofUrl) {
        return NextResponse.json({ error: 'Payment proof URL required' }, { status: 400 })
      }

      // Update all work orders with payment proof
      await prisma.checklistItem.updateMany({
        where: { id: { in: workOrderIds } },
        data: {
          paymentStatus: 'PENDING_VERIFICATION',
          paymentProofUrl,
          paymentProofType: paymentProofType || 'file',
          paymentProofFileName: paymentProofFileName || null,
          paymentSubmittedAt: new Date(),
          paymentSubmittedById: session.user.id,
        }
      })

      // Create notification for contractor
      const firstWorkOrder = workOrders[0]
      const contracts = firstWorkOrder.checklist.project?.contracts || []
      if (contracts.length > 0) {
        const contract = contracts[0]
        
        // Get contractor user ID
        const branch = await prisma.branch.findUnique({
          where: { id: branchId },
          include: {
            client: {
              include: {
                contractor: {
                  include: { user: true }
                }
              }
            }
          }
        })

        if (branch?.client?.contractor?.userId) {
          await prisma.notification.create({
            data: {
              userId: branch.client.contractor.userId,
              type: 'PAYMENT_SUBMITTED',
              title: 'Payment Proof Submitted',
              message: `Payment proof submitted for ${workOrderIds.length} work order${workOrderIds.length > 1 ? 's' : ''} in ${contract.title}`,
              link: `/dashboard/clients/${branch.client.id}/branches/${branchId}?tab=billing`,
            }
          })
        }
      }

      return NextResponse.json({ success: true, message: 'Payment proof submitted' })

    } else if (action === 'verify_payment') {
      // Contractor verifying payment
      if (session.user.role !== 'CONTRACTOR') {
        return NextResponse.json({ error: 'Only contractors can verify payments' }, { status: 403 })
      }

      // Signature is required for verification
      if (!signature) {
        return NextResponse.json({ error: 'Signature is required to verify payment' }, { status: 400 })
      }

      // Update all work orders as paid with signature
      await prisma.checklistItem.updateMany({
        where: { id: { in: workOrderIds } },
        data: {
          paymentStatus: 'PAID',
          paymentVerifiedAt: new Date(),
          paymentVerifiedById: session.user.id,
          paymentVerifiedSignature: signature,
        }
      })

      // Create notification for client
      const verifyFirstWorkOrder = workOrders[0]
      const verifyContracts = verifyFirstWorkOrder.checklist.project?.contracts || []
      if (verifyContracts.length > 0) {
        const verifyContract = verifyContracts[0]
        
        // Get client user ID
        const branch = await prisma.branch.findUnique({
          where: { id: branchId },
          include: {
            client: {
              include: { user: true }
            }
          }
        })

        if (branch?.client?.userId) {
          await prisma.notification.create({
            data: {
              userId: branch.client.userId,
              type: 'PAYMENT_VERIFIED',
              title: 'Payment Verified',
              message: `Payment verified for ${workOrderIds.length} work order${workOrderIds.length > 1 ? 's' : ''} in ${verifyContract.title}`,
              link: `/portal/branches/${branchId}?tab=billing`,
            }
          })
        }

        // Check if all work orders in the contract are now paid - auto-complete contract
        if (verifyContract.projectId) {
          const allProjectWorkOrders = await prisma.checklistItem.findMany({
            where: {
              checklist: { projectId: verifyContract.projectId }
            }
          })

          const allPaid = allProjectWorkOrders.every(wo => wo.paymentStatus === 'PAID')
          const allCompleted = allProjectWorkOrders.every(wo => wo.stage === 'COMPLETED')

          if (allPaid && allCompleted && verifyContract.status !== 'SIGNED') {
            // Auto-complete the contract
            await prisma.contract.update({
              where: { id: verifyContract.id },
              data: { 
                status: 'SIGNED',
                endSignedAt: new Date()
              }
            })

            // Also complete the project
            await prisma.project.update({
              where: { id: verifyContract.projectId },
              data: { 
                status: 'CLOSED',
                completedAt: new Date()
              }
            })

            // Create activity for contract completion
            await prisma.activity.create({
              data: {
                projectId: verifyContract.projectId,
                type: 'STATUS_CHANGE',
                content: `Contract "${verifyContract.title}" auto-completed - all work orders paid`,
                createdById: session.user.id,
                createdByRole: session.user.role as 'CONTRACTOR' | 'CLIENT' | 'TEAM_MEMBER',
              }
            })

            // Notify client
            if (branch?.client?.userId) {
              await prisma.notification.create({
                data: {
                  userId: branch.client.userId,
                  type: 'CONTRACT_SIGNED',
                  title: 'Contract Completed',
                  message: `Contract "${verifyContract.title}" has been completed. All work orders are paid.`,
                  link: `/portal/branches/${branchId}?tab=contracts`,
                }
              })
            }
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Payment verified' })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error updating checklist items:', error)
    return NextResponse.json(
      { error: 'Failed to update checklist items' },
      { status: 500 }
    )
  }
}

// Helper function to verify branch access
async function verifyBranchAccess(branchId: string, userId: string, role: string): Promise<boolean> {
  if (role === 'CONTRACTOR') {
    const contractor = await prisma.contractor.findUnique({
      where: { userId },
      include: {
        clients: {
          include: {
            branches: { where: { id: branchId } }
          }
        }
      }
    })
    return contractor?.clients.some(client => client.branches.length > 0) || false
  } else if (role === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { userId },
      include: { branches: { where: { id: branchId } } }
    })
    return (client?.branches.length || 0) > 0
  } else if (role === 'TEAM_MEMBER') {
    const teamMember = await prisma.teamMember.findUnique({
      where: { userId },
      include: {
        branchAccess: { where: { branchId } }
      }
    })
    return (teamMember?.branchAccess.length || 0) > 0
  }
  return false
}
