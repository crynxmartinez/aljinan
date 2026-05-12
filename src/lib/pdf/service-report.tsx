import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { ServiceReportData } from '@/types/reports'

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
    borderBottomColor: '#ea580c',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ea580c',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#ea580c',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#ea580c',
    backgroundColor: '#fff7ed',
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
    backgroundColor: '#fff7ed',
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
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '25%', textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff7ed',
    fontWeight: 'bold',
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

interface ServiceReportDocumentData {
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
  reportData: ServiceReportData
  signatures: {
    technician: string | null
    technicianDate: string | null
    supervisor: string | null
    supervisorDate: string | null
  }
}

export function ServiceReportDocument({ data }: { data: ServiceReportDocumentData }) {
  const formatDate = (dateStr: string) => {
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
        <Text style={styles.title}>SERVICE REPORT</Text>

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
          <Text style={styles.sectionTitle}>WORK ORDER DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Work Order Report:</Text>
            <Text style={styles.value}>{data.workOrder.title}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Service Date:</Text>
            <Text style={styles.value}>{formatDate(data.workOrder.date)}</Text>
          </View>
        </View>

        {/* Problem Description */}
        {report.problemDescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROBLEM DESCRIPTION</Text>
            <Text style={styles.textBlock}>{report.problemDescription}</Text>
          </View>
        )}

        {/* Root Cause */}
        {report.rootCause && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ROOT CAUSE ANALYSIS</Text>
            <Text style={styles.textBlock}>{report.rootCause}</Text>
          </View>
        )}

        {/* Work Performed */}
        {report.workPerformed && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WORK PERFORMED</Text>
            <Text style={styles.textBlock}>{report.workPerformed}</Text>
          </View>
        )}

        {/* Parts Replaced */}
        {report.partsReplaced && report.partsReplaced.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PARTS REPLACED</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>Part Name</Text>
                <Text style={styles.col2}>Qty</Text>
                <Text style={styles.col3}>Unit Cost</Text>
                <Text style={styles.col4}>Total</Text>
              </View>
              {report.partsReplaced.map((part, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.col1}>{part.name}</Text>
                  <Text style={styles.col2}>{part.quantity}</Text>
                  <Text style={styles.col3}>SAR {part.unitCost.toFixed(2)}</Text>
                  <Text style={styles.col4}>SAR {part.total.toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.col1}>Parts Total</Text>
                <Text style={styles.col2}></Text>
                <Text style={styles.col3}></Text>
                <Text style={styles.col4}>SAR {report.totalPartsCost.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Labor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LABOR</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Hours:</Text>
            <Text style={styles.value}>{report.laborHours}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rate:</Text>
            <Text style={styles.value}>SAR {report.laborRate.toFixed(2)}/hr</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Labor Cost:</Text>
            <Text style={styles.value}>SAR {report.laborCost.toFixed(2)}</Text>
          </View>
        </View>

        {/* Total Cost */}
        <View style={[styles.section, { backgroundColor: '#fff7ed', padding: 10, borderRadius: 4 }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { fontSize: 14 }]}>TOTAL COST:</Text>
            <Text style={[styles.value, { fontSize: 14, fontWeight: 'bold' }]}>SAR {report.totalCost.toFixed(2)}</Text>
          </View>
        </View>

        {/* Warranty */}
        {report.warrantyInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WARRANTY INFORMATION</Text>
            <Text style={styles.textBlock}>{report.warrantyInfo}</Text>
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
