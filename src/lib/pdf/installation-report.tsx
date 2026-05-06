import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { InstallationReportData } from '@/types/reports'

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
    borderBottomColor: '#9333ea',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9333ea',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#9333ea',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#9333ea',
    backgroundColor: '#faf5ff',
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
  textBlock: {
    marginTop: 4,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    lineHeight: 1.4,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#faf5ff',
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
    backgroundColor: '#9333ea',
    color: '#fff',
  },
  badgePass: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '2 8',
    borderRadius: 4,
    fontSize: 9,
  },
  badgeFail: {
    backgroundColor: '#fecaca',
    color: '#991b1b',
    padding: '2 8',
    borderRadius: 4,
    fontSize: 9,
  },
  warrantyBox: {
    backgroundColor: '#faf5ff',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
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
    width: '30%',
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

interface InstallationReportDocumentData {
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
  reportData: InstallationReportData
  signatures: {
    technician: string | null
    technicianDate: string | null
    supervisor: string | null
    supervisorDate: string | null
    client: string | null
    clientDate: string | null
  }
}

export function InstallationReportDocument({ data }: { data: InstallationReportDocumentData }) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const report = data.reportData

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
        <Text style={styles.title}>INSTALLATION REPORT</Text>

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
          <Text style={styles.sectionTitle}>INSTALLATION DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Work Order:</Text>
            <Text style={styles.value}>{data.workOrder.title}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Installation Date:</Text>
            <Text style={styles.value}>{formatDate(data.workOrder.date)}</Text>
          </View>
        </View>

        {/* Equipment Installed */}
        {report.equipmentInstalled && report.equipmentInstalled.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EQUIPMENT INSTALLED</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ width: '30%' }}>Equipment</Text>
                <Text style={{ width: '25%' }}>Model</Text>
                <Text style={{ width: '25%' }}>Serial Number</Text>
                <Text style={{ width: '20%' }}>Location</Text>
              </View>
              {report.equipmentInstalled.map((eq, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={{ width: '30%' }}>{eq.name}</Text>
                  <Text style={{ width: '25%' }}>{eq.model}</Text>
                  <Text style={{ width: '25%' }}>{eq.serialNumber}</Text>
                  <Text style={{ width: '20%' }}>{eq.location}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Configuration Details */}
        {report.configurationDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CONFIGURATION DETAILS</Text>
            <Text style={styles.textBlock}>{report.configurationDetails}</Text>
          </View>
        )}

        {/* Commissioning Checklist */}
        {report.commissioningChecklist && report.commissioningChecklist.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COMMISSIONING CHECKLIST</Text>
            {report.commissioningChecklist.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', padding: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', alignItems: 'center' }}>
                <View style={[styles.checkbox, item.completed ? styles.checkboxChecked : {}]}>
                  {item.completed && <Text>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={item.completed ? { textDecoration: 'line-through', color: '#6b7280' } : {}}>
                    {item.item}
                  </Text>
                  {item.notes && (
                    <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>{item.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Testing Results */}
        {report.testingResults && report.testingResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TESTING RESULTS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ width: '40%' }}>Test</Text>
                <Text style={{ width: '20%', textAlign: 'center' }}>Result</Text>
                <Text style={{ width: '40%' }}>Notes</Text>
              </View>
              {report.testingResults.map((test, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={{ width: '40%' }}>{test.test}</Text>
                  <View style={{ width: '20%', alignItems: 'center' }}>
                    <Text style={test.result === 'pass' ? styles.badgePass : styles.badgeFail}>
                      {test.result.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ width: '40%' }}>{test.notes}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Training */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TRAINING</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Training Provided:</Text>
            <Text style={styles.value}>{report.trainingProvided ? 'Yes' : 'No'}</Text>
          </View>
          {report.trainingProvided && report.trainingNotes && (
            <Text style={styles.textBlock}>{report.trainingNotes}</Text>
          )}
        </View>

        {/* Warranty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WARRANTY INFORMATION</Text>
          <View style={styles.warrantyBox}>
            <View style={styles.row}>
              <Text style={styles.label}>Start Date:</Text>
              <Text style={styles.value}>{formatDate(report.warrantyStartDate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>End Date:</Text>
              <Text style={styles.value}>{formatDate(report.warrantyEndDate)}</Text>
            </View>
          </View>
        </View>

        {/* Handover */}
        {report.handoverName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HANDOVER</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Received By:</Text>
              <Text style={styles.value}>{report.handoverName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Handover Date:</Text>
              <Text style={styles.value}>{formatDate(report.handoverDate)}</Text>
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
            <Text style={styles.signatureLabel}>Technician</Text>
            {data.signatures.technicianDate && (
              <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                {formatDate(data.signatures.technicianDate)}
              </Text>
            )}
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              {data.signatures.supervisor && (
                <Text style={{ fontSize: 10, color: '#166534', fontWeight: 'bold' }}>✓ Signed</Text>
              )}
            </View>
            <Text style={styles.signatureLabel}>Supervisor</Text>
            {data.signatures.supervisorDate && (
              <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                {formatDate(data.signatures.supervisorDate)}
              </Text>
            )}
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              {data.signatures.client && (
                <Text style={{ fontSize: 10, color: '#166534', fontWeight: 'bold' }}>✓ Signed</Text>
              )}
            </View>
            <Text style={styles.signatureLabel}>Client</Text>
            {data.signatures.clientDate && (
              <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                {formatDate(data.signatures.clientDate)}
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
