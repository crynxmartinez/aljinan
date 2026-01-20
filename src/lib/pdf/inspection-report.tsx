import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

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
    borderBottomColor: '#1e40af',
  },
  logo: {
    width: 80,
    height: 40,
  },
  companyInfo: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1e40af',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    color: '#6b7280',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
    backgroundColor: '#eff6ff',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    marginBottom: 8,
  },
  textBlock: {
    marginTop: 4,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    lineHeight: 1.4,
  },
  deficiencyBlock: {
    marginTop: 4,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
    lineHeight: 1.4,
    color: '#991b1b',
  },
  recommendationBlock: {
    marginTop: 4,
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    lineHeight: 1.4,
    color: '#166534',
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
  signatureDate: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 2,
  },
  signedText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: 'bold',
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
  photoSection: {
    marginTop: 10,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoItem: {
    width: '30%',
    marginBottom: 10,
  },
  photo: {
    width: '100%',
    height: 80,
    objectFit: 'cover',
  },
  photoCaption: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '2 6',
    borderRadius: 4,
    fontSize: 9,
    alignSelf: 'flex-start',
  },
})

interface InspectionReportData {
  reportNumber: string
  generatedDate: string
  contractor: {
    name: string
    address: string
    phone: string
    email: string
    logo: string | null
  }
  client: {
    name: string
    branch: string
    address: string
  }
  inspection: {
    title: string
    date: string
    scheduledDate: string | null
    systemsChecked: string
    findings: string
    deficiencies: string
    recommendations: string
    workOrderType: string
  }
  signatures: {
    technician: string | null
    technicianDate: string | null
    supervisor: string | null
    supervisorDate: string | null
  }
  photos: {
    url: string
    caption: string | null
    type: string
  }[]
}

export function InspectionReportDocument({ data }: { data: InspectionReportData }) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatWorkOrderType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase()
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
          <View style={styles.companyInfo}>
            <Text style={{ fontSize: 9, color: '#6b7280' }}>Report No:</Text>
            <Text style={{ fontWeight: 'bold' }}>{data.reportNumber}</Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>Generated:</Text>
            <Text>{formatDate(data.generatedDate)}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>INSPECTION REPORT</Text>
        <Text style={styles.subtitle}>{formatWorkOrderType(data.inspection.workOrderType)} Report</Text>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLIENT INFORMATION</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Company:</Text>
                <Text style={styles.value}>{data.client.name}</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Branch:</Text>
                <Text style={styles.value}>{data.client.branch}</Text>
              </View>
            </View>
            {data.client.address && (
              <View style={{ width: '100%' }}>
                <View style={styles.row}>
                  <Text style={styles.label}>Address:</Text>
                  <Text style={styles.value}>{data.client.address}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Inspection Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INSPECTION DETAILS</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Work Order:</Text>
                <Text style={styles.value}>{data.inspection.title}</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Inspection Date:</Text>
                <Text style={styles.value}>{formatDate(data.inspection.date)}</Text>
              </View>
            </View>
            {data.inspection.systemsChecked && (
              <View style={{ width: '100%' }}>
                <View style={styles.row}>
                  <Text style={styles.label}>Systems Checked:</Text>
                  <Text style={styles.value}>{data.inspection.systemsChecked}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Findings */}
        {data.inspection.findings && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FINDINGS</Text>
            <Text style={styles.textBlock}>{data.inspection.findings}</Text>
          </View>
        )}

        {/* Deficiencies */}
        {data.inspection.deficiencies && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEFICIENCIES</Text>
            <Text style={styles.deficiencyBlock}>{data.inspection.deficiencies}</Text>
          </View>
        )}

        {/* Recommendations */}
        {data.inspection.recommendations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECOMMENDATIONS</Text>
            <Text style={styles.recommendationBlock}>{data.inspection.recommendations}</Text>
          </View>
        )}

        {/* Photos */}
        {data.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PHOTOS</Text>
            <View style={styles.photoGrid}>
              {data.photos.slice(0, 6).map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image src={photo.url} style={styles.photo} />
                  {photo.caption && <Text style={styles.photoCaption}>{photo.caption}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              {data.signatures.technician && (
                <Text style={styles.signedText}>✓ Signed</Text>
              )}
            </View>
            <Text style={styles.signatureLabel}>Technician Signature</Text>
            {data.signatures.technicianDate && (
              <Text style={styles.signatureDate}>
                Signed: {formatDate(data.signatures.technicianDate)}
              </Text>
            )}
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              {data.signatures.supervisor && (
                <Text style={styles.signedText}>✓ Signed</Text>
              )}
            </View>
            <Text style={styles.signatureLabel}>Supervisor Signature</Text>
            {data.signatures.supervisorDate && (
              <Text style={styles.signatureDate}>
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
