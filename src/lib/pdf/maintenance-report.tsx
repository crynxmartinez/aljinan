import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { MaintenanceReportData } from '@/types/reports'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#16a34a',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    padding: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
    color: '#374151',
  },
  value: {
    width: '70%',
    color: '#1f2937',
  },
  badge: {
    padding: '2 8',
    borderRadius: 4,
    fontSize: 9,
    alignSelf: 'flex-start',
  },
  badgeGood: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeFair: {
    backgroundColor: '#fef9c3',
    color: '#854d0e',
  },
  badgePoor: {
    backgroundColor: '#fed7aa',
    color: '#9a3412',
  },
  badgeCritical: {
    backgroundColor: '#fecaca',
    color: '#991b1b',
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 6,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  taskRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginRight: 8,
    textAlign: 'center',
    fontSize: 8,
  },
  checkboxChecked: {
    backgroundColor: '#16a34a',
    color: '#fff',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  signatureBox: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 4,
    height: 30,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
})

interface MaintenanceReportDocumentData {
  reportNumber: string
  generatedDate: string
  contractor: {
    name: string
    address: string
    phone: string
    email: string
  }
  client: {
    name: string
    branch: string
    address: string
  }
  workOrder: {
    title: string
    date: string
    scheduledDate: string | null
  }
  reportData: MaintenanceReportData
  signatures: {
    technician: string | null
    technicianDate: string | null
    supervisor: string | null
    supervisorDate: string | null
  }
}

export function MaintenanceReportDocument({ data }: { data: MaintenanceReportDocumentData }) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const report = data.reportData

  const getConditionStyle = (condition: string) => {
    switch (condition) {
      case 'good': return styles.badgeGood
      case 'fair': return styles.badgeFair
      case 'poor': return styles.badgePoor
      case 'critical': return styles.badgeCritical
      default: return {}
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'normal': return { color: '#16a34a' }
      case 'warning': return { color: '#ca8a04' }
      case 'critical': return { color: '#dc2626' }
      default: return {}
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{data.contractor.name}</Text>
            {data.contractor.address && <Text>{data.contractor.address}</Text>}
            {data.contractor.phone && <Text>Tel: {data.contractor.phone}</Text>}
            {data.contractor.email && <Text>Email: {data.contractor.email}</Text>}
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 9, color: '#6b7280' }}>Report No:</Text>
            <Text style={{ fontWeight: 'bold' }}>{data.reportNumber}</Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>Generated:</Text>
            <Text>{formatDate(data.generatedDate)}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>MAINTENANCE REPORT</Text>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLIENT INFORMATION</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Company:</Text>
            <Text style={styles.value}>{data.client.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Branch:</Text>
            <Text style={styles.value}>{data.client.branch}</Text>
          </View>
          {data.client.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{data.client.address}</Text>
            </View>
          )}
        </View>

        {/* Work Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MAINTENANCE DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Work Order:</Text>
            <Text style={styles.value}>{data.workOrder.title}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Maintenance Date:</Text>
            <Text style={styles.value}>{formatDate(data.workOrder.date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Equipment Condition:</Text>
            <Text style={[styles.badge, getConditionStyle(report.equipmentCondition)]}>
              {report.equipmentCondition.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Tasks Performed */}
        {report.tasksPerformed && report.tasksPerformed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TASKS PERFORMED</Text>
            {report.tasksPerformed.map((task, index) => (
              <View key={index} style={styles.taskRow}>
                <View style={[styles.checkbox, task.completed ? styles.checkboxChecked : {}]}>
                  {task.completed && <Text>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={task.completed ? { textDecoration: 'line-through', color: '#6b7280' } : {}}>
                    {task.task}
                  </Text>
                  {task.notes && (
                    <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>{task.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Measurements */}
        {report.measurements && report.measurements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MEASUREMENTS & READINGS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ width: '25%' }}>Parameter</Text>
                <Text style={{ width: '20%', textAlign: 'center' }}>Value</Text>
                <Text style={{ width: '15%', textAlign: 'center' }}>Unit</Text>
                <Text style={{ width: '20%', textAlign: 'center' }}>Normal Range</Text>
                <Text style={{ width: '20%', textAlign: 'center' }}>Status</Text>
              </View>
              {report.measurements.map((m, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={{ width: '25%' }}>{m.name}</Text>
                  <Text style={{ width: '20%', textAlign: 'center' }}>{m.value}</Text>
                  <Text style={{ width: '15%', textAlign: 'center' }}>{m.unit}</Text>
                  <Text style={{ width: '20%', textAlign: 'center' }}>{m.normalRange}</Text>
                  <Text style={[{ width: '20%', textAlign: 'center' }, getStatusStyle(m.status)]}>
                    {m.status.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Consumables Used */}
        {report.consumablesUsed && report.consumablesUsed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CONSUMABLES USED</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ width: '70%' }}>Item</Text>
                <Text style={{ width: '30%', textAlign: 'right' }}>Quantity</Text>
              </View>
              {report.consumablesUsed.map((c, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={{ width: '70%' }}>{c.item}</Text>
                  <Text style={{ width: '30%', textAlign: 'right' }}>{c.quantity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Next Maintenance */}
        {report.nextMaintenanceDate && (
          <View style={[styles.section, { backgroundColor: '#f0fdf4', padding: 10, borderRadius: 4 }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { fontSize: 12 }]}>NEXT MAINTENANCE:</Text>
              <Text style={[styles.value, { fontSize: 12, fontWeight: 'bold' }]}>
                {formatDate(report.nextMaintenanceDate)}
              </Text>
            </View>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              {data.signatures.technician && (
                <Text style={{ fontSize: 10, color: '#166534', fontWeight: 'bold' }}>✓ Signed</Text>
              )}
            </View>
            <Text style={styles.signatureLabel}>Technician Signature</Text>
            {data.signatures.technicianDate && (
              <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                Signed: {formatDate(data.signatures.technicianDate)}
              </Text>
            )}
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              {data.signatures.supervisor && (
                <Text style={{ fontSize: 10, color: '#166534', fontWeight: 'bold' }}>✓ Signed</Text>
              )}
            </View>
            <Text style={styles.signatureLabel}>Supervisor Signature</Text>
            {data.signatures.supervisorDate && (
              <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                Signed: {formatDate(data.signatures.supervisorDate)}
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This report was generated by {data.contractor.name} • Report #{data.reportNumber} • {formatDate(data.generatedDate)}
        </Text>
      </Page>
    </Document>
  )
}
