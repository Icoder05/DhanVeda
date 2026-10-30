import VentureIQApp from '@/components/venture/VentureIQApp'

export const metadata = { title: 'Pitch Studio — ArthaSift' }

export default function VentureDocumentsPage() {
  return (
    <div className="dv-main">
      <VentureIQApp initialView="documents" />
    </div>
  )
}
