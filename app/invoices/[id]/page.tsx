import InvoiceDetailClient from './InvoiceDetailClient'

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  return <InvoiceDetailClient id={params.id} />
}
